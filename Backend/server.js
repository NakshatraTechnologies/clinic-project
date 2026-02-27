const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDefaultUsers = require('./seeders/adminSeeder');

// Load environment variables
dotenv.config();

// Connect to MongoDB & run seeder
connectDB().then(() => {
  // Seed default users after DB connection
  seedDefaultUsers();
});

// Initialize Express app
const app = express();

// --- Global Middleware ---

// CORS configuration - supports multiple origins (comma-separated in FRONTEND_URL)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files (prescription PDFs, uploads)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health Check Route ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Clinic Management System API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/slots/exceptions', require('./routes/exceptionRoutes'));
app.use('/api/slots', require('./routes/slotRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/queue', require('./routes/queueRoutes'));
app.use('/api/receptionist', require('./routes/receptionistRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/clinic', require('./routes/clinicRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

// --- Public doctor search (no auth required) ---
const DoctorProfile = require('./models/DoctorProfile');
app.get('/api/public/doctors', async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ isApproved: true })
      .populate('userId', 'name phone email')
      .populate('clinicId', 'name slug')
      .select('-__v');
    res.json({ success: true, count: doctors.length, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Public single doctor profile (no auth required) ---
app.get('/api/public/doctors/:id', async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name phone email')
      .populate('clinicId', 'name slug')
      .select('-__v');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, doctor });
  } catch (err) {
    // Handle invalid ObjectId
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Patient dashboard stats (requires auth) ---
const { protect: authProtect } = require('./middleware/auth');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');

app.get('/api/appointments/stats', authProtect, async (req, res) => {
  try {
    const patientId = req.user._id;
    const now = new Date();
    const today = new Date(now.toDateString());

    // Upcoming (confirmed/pending, date >= today)
    const upcoming = await Appointment.countDocuments({
      patientId,
      date: { $gte: today },
      status: { $in: ['confirmed', 'pending'] },
    });

    // Completed
    const completed = await Appointment.countDocuments({
      patientId,
      status: 'completed',
    });

    // Prescriptions
    const prescriptions = await Prescription.countDocuments({ patientId });

    // Next upcoming appointment (closest future)
    const nextAppointment = await Appointment.findOne({
      patientId,
      date: { $gte: today },
      status: { $in: ['confirmed', 'pending'] },
    })
      .sort({ date: 1, startTime: 1 })
      .populate('doctorId', 'name phone')
      .lean();

    res.json({
      success: true,
      stats: {
        upcoming,
        completed,
        prescriptions,
        savedDoctors: 0, // placeholder for future feature
      },
      nextAppointment: nextAppointment || null,
    });
  } catch (err) {
    console.error('Patient Stats Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field: ${field}. Please use another value.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please login again.',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
});
