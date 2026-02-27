const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Prescription = require('../models/Prescription');

// ==========================================
// @desc    Doctor Dashboard Stats
// @route   GET /api/doctors/dashboard
// @access  Private (Doctor)
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Today's appointments
    const todayAppointments = await Appointment.find({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    }).populate('patientId', 'name phone');

    // Stats counts
    const todayStats = {
      total: todayAppointments.length,
      pending: todayAppointments.filter((a) => a.status === 'pending').length,
      confirmed: todayAppointments.filter((a) => a.status === 'confirmed').length,
      completed: todayAppointments.filter((a) => a.status === 'completed').length,
      cancelled: todayAppointments.filter((a) => a.status === 'cancelled').length,
      noShow: todayAppointments.filter((a) => a.status === 'no-show').length,
    };

    // Revenue calculations
    const todayRevenue = todayAppointments
      .filter((a) => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.amount, 0);

    const pendingPayments = todayAppointments
      .filter((a) => a.paymentStatus === 'pending' && a.status !== 'cancelled')
      .reduce((sum, a) => sum + a.amount, 0);

    // This month's revenue
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyPaidAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfMonth },
      paymentStatus: 'paid',
    });
    const monthlyRevenue = monthlyPaidAppointments.reduce(
      (sum, a) => sum + a.amount,
      0
    );

    // Total unique patients
    const totalPatients = await Appointment.distinct('patientId', { doctorId });

    // Total all-time appointments
    const totalAppointments = await Appointment.countDocuments({ doctorId });

    // Get today's queue
    const queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    });

    res.status(200).json({
      success: true,
      dashboard: {
        today: {
          ...todayStats,
          revenue: todayRevenue,
          pendingPayments,
          appointments: todayAppointments,
        },
        monthly: {
          revenue: monthlyRevenue,
        },
        overall: {
          totalPatients: totalPatients.length,
          totalAppointments,
        },
        queue: queue || null,
      },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's own profile (full)
// @route   GET /api/doctors/profile
// @access  Private (Doctor)
// ==========================================
const getMyDoctorProfile = async (req, res) => {
  try {
    const doctorProfile = await DoctorProfile.findOne({
      userId: req.user._id,
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      user,
      doctorProfile,
    });
  } catch (error) {
    console.error('Get Doctor Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Update doctor profile
// @route   PUT /api/doctors/profile
// @access  Private (Doctor)
// ==========================================
const updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      qualifications,
      experience,
      consultationFee,
      slotDuration,
      bio,
      clinicName,
      clinicAddress,
      clinicLocation,
      clinicPhotos,
      licenseNumber,
    } = req.body;

    let doctorProfile = await DoctorProfile.findOne({
      userId: req.user._id,
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // Update fields if provided
    if (specialization) doctorProfile.specialization = specialization;
    if (qualifications) doctorProfile.qualifications = qualifications;
    if (experience !== undefined) doctorProfile.experience = experience;
    if (consultationFee !== undefined)
      doctorProfile.consultationFee = consultationFee;
    if (slotDuration) doctorProfile.slotDuration = slotDuration;
    if (bio !== undefined) doctorProfile.bio = bio;
    if (clinicName !== undefined) doctorProfile.clinicName = clinicName;
    if (clinicAddress)
      doctorProfile.clinicAddress = {
        ...doctorProfile.clinicAddress,
        ...clinicAddress,
      };
    if (clinicLocation) doctorProfile.clinicLocation = clinicLocation;
    if (clinicPhotos) doctorProfile.clinicPhotos = clinicPhotos;
    if (licenseNumber !== undefined)
      doctorProfile.licenseNumber = licenseNumber;

    await doctorProfile.save();

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctorProfile,
    });
  } catch (error) {
    console.error('Update Doctor Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's patient list (unique patients)
// @route   GET /api/doctors/patients
// @access  Private (Doctor)
// ==========================================
const getMyPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const doctorId = req.user._id;

    // Get unique patient IDs
    const patientIds = await Appointment.distinct('patientId', { doctorId });

    // Build search filter
    let filter = { _id: { $in: patientIds } };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const patients = await User.find(filter)
      .select('name phone email gender dateOfBirth bloodGroup allergies')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await User.countDocuments(filter);

    // For each patient, get last visit
    const patientsWithLastVisit = await Promise.all(
      patients.map(async (patient) => {
        const lastAppointment = await Appointment.findOne({
          doctorId,
          patientId: patient._id,
          status: 'completed',
        })
          .sort({ date: -1 })
          .select('date');

        return {
          ...patient.toObject(),
          lastVisit: lastAppointment ? lastAppointment.date : null,
          totalVisits: await Appointment.countDocuments({
            doctorId,
            patientId: patient._id,
            status: 'completed',
          }),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: patients.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      patients: patientsWithLastVisit,
    });
  } catch (error) {
    console.error('Get Patients Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patients',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get patient's medical record (EMR)
// @route   GET /api/doctors/patients/:patientId/records
// @access  Private (Doctor)
// ==========================================
const getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user._id;

    // Get patient info
    const patient = await User.findById(patientId).select(
      'name phone email gender dateOfBirth bloodGroup allergies address'
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get all appointments with this doctor
    const appointments = await Appointment.find({
      doctorId,
      patientId,
    }).sort({ date: -1 });

    // Get all prescriptions for this patient by this doctor
    const prescriptions = await Prescription.find({
      doctorId,
      patientId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      patient,
      appointments,
      prescriptions,
    });
  } catch (error) {
    console.error('Get Patient Records Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get patient records',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getMyDoctorProfile,
  updateDoctorProfile,
  getMyPatients,
  getPatientRecords,
};
