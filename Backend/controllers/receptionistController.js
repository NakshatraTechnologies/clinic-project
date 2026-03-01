const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Queue = require('../models/Queue');

// ==========================================
// @desc    Walk-in: Register new patient & create appointment
// @route   POST /api/receptionist/walk-in
// @access  Private (Receptionist, Doctor)
// ==========================================
const walkInEntry = async (req, res) => {
  try {
    const { name, phone, gender, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Patient name and phone are required',
      });
    }

    // Determine doctor ID
    let doctorId;
    if (req.user.role === 'receptionist') {
      doctorId = req.user.createdBy;
    } else if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for walk-in entry',
      });
    }

    // Get doctor profile for consultation fee
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Check if patient already exists by phone
    let patient = await User.findOne({ phone });

    if (!patient) {
      // Create new patient
      patient = await User.create({
        name,
        phone,
        role: 'patient',
        gender: gender || null,
        isPhoneVerified: false, // Walk-in, not OTP verified
        isActive: true,
      });
    }

    // Create today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find next available time (current time rounded up to next slot)
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes =
      Math.ceil(minutes / doctorProfile.slotDuration) *
      doctorProfile.slotDuration;
    now.setMinutes(roundedMinutes, 0, 0);

    const startTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const endMinutes =
      now.getHours() * 60 + now.getMinutes() + doctorProfile.slotDuration;
    const endTime = `${Math.floor(endMinutes / 60)
      .toString()
      .padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Create appointment
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      date: today,
      startTime,
      endTime,
      status: 'confirmed',
      type: 'walk-in',
      paymentStatus: 'pending',
      amount: doctorProfile.consultationFee,
      notes: notes || '',
      bookedBy: req.user._id,
    });

    // Auto check-in to queue
    let queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: new Date(today.getTime() + 86400000) },
    });

    if (!queue) {
      queue = await Queue.create({
        doctorId,
        date: today,
        currentToken: 0,
        totalTokensIssued: 0,
        patients: [],
      });
    }

    queue.totalTokensIssued += 1;
    const tokenNumber = queue.totalTokensIssued;

    queue.patients.push({
      appointmentId: appointment._id,
      patientId: patient._id,
      tokenNumber,
      status: 'waiting',
      checkInTime: new Date(),
    });

    await queue.save();

    res.status(201).json({
      success: true,
      message: `Walk-in registered. Token #${tokenNumber}`,
      patient: {
        _id: patient._id,
        name: patient.name,
        phone: patient.phone,
      },
      appointment,
      tokenNumber,
    });
  } catch (error) {
    // Handle duplicate appointment (same time slot)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A time slot conflict occurred. Please try again.',
      });
    }
    console.error('Walk-in Entry Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register walk-in',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Collect payment for an appointment
// @route   PUT /api/receptionist/collect-payment/:appointmentId
// @access  Private (Receptionist, Doctor)
// ==========================================
const collectPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { paymentMethod, amount, transactionId } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required (cash, upi, online)',
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Update payment
    appointment.paymentStatus = 'paid';
    appointment.paymentMethod = paymentMethod;
    if (amount) appointment.amount = amount;
    if (transactionId) appointment.transactionId = transactionId;
    await appointment.save();

    const updated = await Appointment.findById(appointmentId)
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Payment collected successfully',
      appointment: updated,
    });
  } catch (error) {
    console.error('Collect Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to collect payment',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get today's summary for receptionist
// @route   GET /api/receptionist/today-summary
// @access  Private (Receptionist)
// ==========================================
const getTodaySummary = async (req, res) => {
  try {
    let doctorId;
    if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    }
    // For receptionist, createdBy points to clinic admin, not doctor
    // Use clinicId to see all clinic appointments instead

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Build filter: use doctorId if available, otherwise clinicId
    const filter = { date: { $gte: today, $lte: endOfDay } };
    if (doctorId) {
      filter.doctorId = doctorId;
    } else if (req.user.clinicId) {
      filter.clinicId = req.user.clinicId;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name phone gender')
      .populate('doctorId', 'name phone')
      .sort({ startTime: 1 });

    // Payment stats
    const totalCollected = appointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.amount, 0);

    const totalPending = appointments
      .filter(
        (a) => a.paymentStatus === 'pending' && a.status !== 'cancelled'
      )
      .reduce((sum, a) => sum + a.amount, 0);

    const stats = {
      totalAppointments: appointments.length,
      online: appointments.filter((a) => a.type === 'online').length,
      walkIn: appointments.filter((a) => a.type === 'walk-in').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length,
      totalCollected,
      totalPending,
    };

    res.status(200).json({
      success: true,
      stats,
      appointments,
    });
  } catch (error) {
    console.error('Today Summary Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today summary',
      error: error.message,
    });
  }
};

module.exports = {
  walkInEntry,
  collectPayment,
  getTodaySummary,
};
