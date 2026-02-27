const User = require('../models/User');
const Clinic = require('../models/Clinic');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');

// ==========================================
// @desc    Admin Dashboard Stats (Platform-Level)
// @route   GET /api/admin/dashboard
// @access  Private (Super Admin)
// ==========================================
const getAdminDashboard = async (req, res) => {
  try {
    // Total counts
    const totalClinics = await Clinic.countDocuments();
    const activeClinics = await Clinic.countDocuments({ isActive: true });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalReceptionists = await User.countDocuments({ role: 'receptionist' });
    const totalClinicAdmins = await User.countDocuments({ role: 'clinic_admin' });
    const totalAppointments = await Appointment.countDocuments();

    // Pending doctor verifications
    const pendingVerifications = await DoctorProfile.countDocuments({
      isApproved: false,
    });

    // Active clinic subscriptions
    const activeSubscriptions = await Clinic.countDocuments({
      subscriptionPlan: { $ne: 'free' },
      subscriptionExpiry: { $gt: new Date() },
    });

    // Expiring soon (next 7 days)
    const expiringSoon = await Clinic.countDocuments({
      subscriptionExpiry: {
        $gt: new Date(),
        $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Platform revenue (total paid appointments)
    const paidAppointments = await Appointment.find({ paymentStatus: 'paid' });
    const totalRevenue = paidAppointments.reduce((sum, a) => sum + a.amount, 0);

    // Recent stats - last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newClinicsThisMonth = await Clinic.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newDoctorsThisMonth = await User.countDocuments({
      role: 'doctor',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const newPatientsThisMonth = await User.countDocuments({
      role: 'patient',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const appointmentsThisMonth = await Appointment.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.status(200).json({
      success: true,
      dashboard: {
        clinics: {
          total: totalClinics,
          active: activeClinics,
          newThisMonth: newClinicsThisMonth,
        },
        users: {
          totalDoctors,
          totalPatients,
          totalReceptionists,
          totalClinicAdmins,
          newDoctorsThisMonth,
          newPatientsThisMonth,
        },
        appointments: {
          total: totalAppointments,
          thisMonth: appointmentsThisMonth,
        },
        subscriptions: {
          active: activeSubscriptions,
          expiringSoon,
          pendingVerifications,
        },
        revenue: {
          total: totalRevenue,
        },
      },
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin dashboard',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get all doctors (platform-level, with clinic info)
// @route   GET /api/admin/doctors
// @access  Private (Super Admin)
// ==========================================
const getAllDoctors = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    let userFilter = { role: 'doctor' };
    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await User.find(userFilter)
      .select('-password')
      .populate('clinicId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Get profiles for each doctor
    const doctorsWithProfiles = await Promise.all(
      doctors.map(async (doctor) => {
        const profile = await DoctorProfile.findOne({ userId: doctor._id });
        return {
          ...doctor.toObject(),
          doctorProfile: profile,
        };
      })
    );

    // Filter by approval status if specified
    let filtered = doctorsWithProfiles;
    if (status === 'pending') {
      filtered = doctorsWithProfiles.filter(
        (d) => d.doctorProfile && !d.doctorProfile.isApproved
      );
    } else if (status === 'approved') {
      filtered = doctorsWithProfiles.filter(
        (d) => d.doctorProfile && d.doctorProfile.isApproved
      );
    }

    const total = await User.countDocuments(userFilter);

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      doctors: filtered,
    });
  } catch (error) {
    console.error('Get All Doctors Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctors',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Verify/Approve a doctor
// @route   PUT /api/admin/doctors/:doctorId/verify
// @access  Private (Super Admin)
// ==========================================
const verifyDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { isApproved } = req.body;

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    doctorProfile.isApproved = isApproved !== undefined ? isApproved : true;
    await doctorProfile.save();

    // Also update user's isVerified
    await User.findByIdAndUpdate(doctorId, {
      isVerified: doctorProfile.isApproved,
    });

    res.status(200).json({
      success: true,
      message: doctorProfile.isApproved
        ? 'Doctor verified and approved ✅'
        : 'Doctor verification revoked',
      doctorProfile,
    });
  } catch (error) {
    console.error('Verify Doctor Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify doctor',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private (Super Admin)
// ==========================================
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('clinicId', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Toggle user active status
// @route   PUT /api/admin/users/:userId/toggle-active
// @access  Private (Super Admin)
// ==========================================
const toggleUserActive = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: user.isActive ? 'User activated' : 'User deactivated',
      user: {
        _id: user._id,
        name: user.name,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Toggle Active Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAllDoctors,
  verifyDoctor,
  getAllUsers,
  toggleUserActive,
};
