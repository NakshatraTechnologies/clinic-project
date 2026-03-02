const User = require('../models/User');
const Clinic = require('../models/Clinic');
const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');

// Helper: ensure isAvailable days always have at least one time slot
const DEFAULT_SLOTS = [{ startTime: '09:00', endTime: '13:00' }, { startTime: '17:00', endTime: '21:00' }];
const sanitizeAvailability = (availability) => {
  if (!Array.isArray(availability)) return availability;
  return availability.map(day => {
    if (day.isAvailable && (!day.slots || day.slots.length === 0)) {
      return { ...day, slots: [...DEFAULT_SLOTS] };
    }
    return day;
  });
};

// ==========================================
// SUPER ADMIN — Clinic CRUD
// ==========================================

// @desc    Create a new clinic + clinic_admin
// @route   POST /api/admin/clinics
// @access  Private (Super Admin)
const createClinic = async (req, res) => {
  try {
    const {
      clinicName,
      clinicPhone,
      clinicEmail,
      clinicAddress,
      clinicDescription,
      phone,
      email,
      address,
      description,
      subscriptionPlan,
      // Clinic admin details
      adminName,
      adminPhone,
      adminEmail,
    } = req.body;

    // Validate
    if (!clinicName || !adminName || !adminPhone) {
      return res.status(400).json({
        success: false,
        message: 'Clinic name, admin name, and admin phone are required',
      });
    }

    // Check if admin phone already exists
    const existingUser = await User.findOne({ phone: adminPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user with phone ${adminPhone} already exists`,
      });
    }

    // 1. Create Clinic Admin user first (without clinicId — will link after)
    const clinicAdmin = await User.create({
      name: adminName,
      phone: adminPhone,
      email: adminEmail || '',
      role: 'clinic_admin',
      isPhoneVerified: true,
      isActive: true,
      createdBy: req.user._id,
    });

    // 2. Create Clinic
    const clinic = await Clinic.create({
      name: clinicName,
      ownerId: clinicAdmin._id,
      phone: clinicPhone || phone || adminPhone,
      email: clinicEmail || email || adminEmail || '',
      address: clinicAddress || address || {},
      description: clinicDescription || description || '',
      subscriptionPlan: subscriptionPlan || 'free',
    });

    // 3. Link clinic admin to the clinic
    clinicAdmin.clinicId = clinic._id;
    await clinicAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Clinic created successfully with admin account',
      clinic,
      clinicAdmin: {
        _id: clinicAdmin._id,
        name: clinicAdmin.name,
        phone: clinicAdmin.phone,
        role: clinicAdmin.role,
      },
    });
  } catch (error) {
    console.error('Create Clinic Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create clinic',
      error: error.message,
    });
  }
};

// @desc    Get all clinics
// @route   GET /api/admin/clinics
// @access  Private (Super Admin)
const getAllClinics = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }

    const clinics = await Clinic.find(filter)
      .populate('ownerId', 'name phone email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Add doctor + receptionist count per clinic
    const clinicsWithStats = await Promise.all(
      clinics.map(async (clinic) => {
        const doctorCount = await User.countDocuments({
          clinicId: clinic._id,
          role: 'doctor',
        });
        const receptionistCount = await User.countDocuments({
          clinicId: clinic._id,
          role: 'receptionist',
        });
        return {
          ...clinic.toObject(),
          stats: { doctorCount, receptionistCount },
        };
      })
    );

    const total = await Clinic.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: clinicsWithStats.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      clinics: clinicsWithStats,
    });
  } catch (error) {
    console.error('Get All Clinics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinics',
      error: error.message,
    });
  }
};

// @desc    Update clinic details
// @route   PUT /api/admin/clinics/:id
// @access  Private (Super Admin)
const updateClinic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, description, subscriptionPlan, subscriptionDurationMonths } = req.body;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found',
      });
    }

    if (name) clinic.name = name;
    if (phone) clinic.phone = phone;
    if (email) clinic.email = email;
    if (address) clinic.address = { ...clinic.address, ...address };
    if (description !== undefined) clinic.description = description;

    // Subscription update
    if (subscriptionPlan) {
      const validPlans = ['free', 'professional', 'enterprise'];
      if (!validPlans.includes(subscriptionPlan)) {
        return res.status(400).json({
          success: false,
          message: `Invalid plan. Must be one of: ${validPlans.join(', ')}`,
        });
      }
      clinic.subscriptionPlan = subscriptionPlan;
      if (subscriptionPlan === 'free') {
        clinic.subscriptionExpiry = null;
      } else {
        const months = subscriptionDurationMonths || 1;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);
        clinic.subscriptionExpiry = expiry;
      }
    }

    await clinic.save();

    res.status(200).json({
      success: true,
      message: 'Clinic updated successfully',
      clinic,
    });
  } catch (error) {
    console.error('Update Clinic Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update clinic',
      error: error.message,
    });
  }
};

// @desc    Toggle clinic active status
// @route   PUT /api/admin/clinics/:id/toggle
// @access  Private (Super Admin)
const toggleClinicActive = async (req, res) => {
  try {
    const { id } = req.params;

    const clinic = await Clinic.findById(id);
    if (!clinic) {
      return res.status(404).json({
        success: false,
        message: 'Clinic not found',
      });
    }

    clinic.isActive = !clinic.isActive;
    await clinic.save();

    // Also toggle all staff in this clinic
    await User.updateMany(
      { clinicId: clinic._id },
      { isActive: clinic.isActive }
    );

    res.status(200).json({
      success: true,
      message: clinic.isActive ? 'Clinic activated' : 'Clinic deactivated',
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        isActive: clinic.isActive,
      },
    });
  } catch (error) {
    console.error('Toggle Clinic Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle clinic status',
      error: error.message,
    });
  }
};

// ==========================================
// CLINIC ADMIN — Manage their own clinic
// ==========================================

// @desc    Get clinic dashboard stats
// @route   GET /api/clinic/dashboard
// @access  Private (Clinic Admin)
const getClinicDashboard = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    if (!clinicId) {
      return res.status(400).json({
        success: false,
        message: 'No clinic associated with this account',
      });
    }

    const clinic = await Clinic.findById(clinicId);

    const totalDoctors = await User.countDocuments({ clinicId, role: 'doctor' });
    const totalReceptionists = await User.countDocuments({ clinicId, role: 'receptionist' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayAppointments = await Appointment.countDocuments({
      clinicId,
      date: { $gte: today, $lte: endOfDay },
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyAppointments = await Appointment.countDocuments({
      clinicId,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const paidAppointments = await Appointment.find({
      clinicId,
      paymentStatus: 'paid',
      createdAt: { $gte: thirtyDaysAgo },
    });
    const monthlyRevenue = paidAppointments.reduce((sum, a) => sum + a.amount, 0);

    const pendingVerifications = await DoctorProfile.countDocuments({
      clinicId,
      isApproved: false,
    });

    res.status(200).json({
      success: true,
      clinic: {
        _id: clinic._id,
        name: clinic.name,
        subscriptionPlan: clinic.subscriptionPlan,
        subscriptionExpiry: clinic.subscriptionExpiry,
      },
      dashboard: {
        totalDoctors,
        totalReceptionists,
        todayAppointments,
        monthlyAppointments,
        monthlyRevenue,
        pendingVerifications,
      },
    });
  } catch (error) {
    console.error('Clinic Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinic dashboard',
      error: error.message,
    });
  }
};

// @desc    Add a doctor to this clinic
// @route   POST /api/clinic/doctors
// @access  Private (Clinic Admin)
const addDoctor = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;

    const {
      name,
      phone,
      email,
      specialization,
      qualifications,
      experience,
      consultationFee,
      slotDuration,
      bio,
      clinicName,
      clinicAddress,
      licenseNumber,
      availability,
    } = req.body;

    if (!name || !phone || !specialization || !consultationFee) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, specialization, and consultation fee are required',
      });
    }

    // Check if phone is already taken
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `A user with phone ${phone} already exists`,
      });
    }

    // Create doctor user
    const doctorUser = await User.create({
      name,
      phone,
      email: email || '',
      role: 'doctor',
      clinicId,
      isPhoneVerified: true,
      isActive: true,
      createdBy: req.user._id,
    });

    // Create doctor profile
    const doctorProfile = await DoctorProfile.create({
      userId: doctorUser._id,
      clinicId,
      specialization: Array.isArray(specialization) ? specialization : [specialization],
      qualifications: qualifications || [],
      experience: experience || 0,
      consultationFee,
      slotDuration: slotDuration || 15,
      bio: bio || '',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || {},
      licenseNumber: licenseNumber || '',
      availability: sanitizeAvailability(
        availability && availability.length > 0 ? availability : [
          { day: 'monday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'tuesday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'wednesday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'thursday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'friday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'saturday', isAvailable: true, slots: [...DEFAULT_SLOTS] },
          { day: 'sunday', isAvailable: false, slots: [] }
        ]
      ),
      isApproved: true, // Clinic admin adds → auto-approved
    });

    res.status(201).json({
      success: true,
      message: 'Doctor added to clinic successfully',
      doctor: {
        _id: doctorUser._id,
        name: doctorUser.name,
        phone: doctorUser.phone,
        role: doctorUser.role,
        clinicId: doctorUser.clinicId,
      },
      doctorProfile,
    });
  } catch (error) {
    console.error('Add Doctor Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add doctor',
      error: error.message,
    });
  }
};

// @desc    Add a receptionist to this clinic
// @route   POST /api/clinic/receptionists
// @access  Private (Clinic Admin, Doctor)
const addReceptionist = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone number are required',
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists',
      });
    }

    const receptionist = await User.create({
      name,
      phone,
      email: email || '',
      role: 'receptionist',
      clinicId,
      createdBy: req.user._id, // Could be clinic_admin or doctor
      isPhoneVerified: true,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Receptionist added to clinic successfully',
      receptionist: {
        _id: receptionist._id,
        name: receptionist.name,
        phone: receptionist.phone,
        role: receptionist.role,
        clinicId: receptionist.clinicId,
        createdBy: receptionist.createdBy,
      },
    });
  } catch (error) {
    console.error('Add Receptionist Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add receptionist',
      error: error.message,
    });
  }
};

// @desc    Get all doctors in this clinic
// @route   GET /api/clinic/doctors
// @access  Private (Clinic Admin)
const getClinicDoctors = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { search, page = 1, limit = 20 } = req.query;

    let filter = { clinicId, role: 'doctor' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const doctors = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Attach profiles
    const doctorsWithProfiles = await Promise.all(
      doctors.map(async (doc) => {
        const profile = await DoctorProfile.findOne({ userId: doc._id });
        return { ...doc.toObject(), doctorProfile: profile };
      })
    );

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: doctorsWithProfiles.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      doctors: doctorsWithProfiles,
    });
  } catch (error) {
    console.error('Get Clinic Doctors Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinic doctors',
      error: error.message,
    });
  }
};

// @desc    Get all receptionists in this clinic
// @route   GET /api/clinic/receptionists
// @access  Private (Clinic Admin)
const getClinicReceptionists = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { search, page = 1, limit = 20 } = req.query;

    let filter = { clinicId, role: 'receptionist' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const receptionists = await User.find(filter)
      .select('-password')
      .populate('createdBy', 'name role')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: receptionists.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      receptionists,
    });
  } catch (error) {
    console.error('Get Clinic Receptionists Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get clinic receptionists',
      error: error.message,
    });
  }
};

// @desc    Update a doctor in this clinic
// @route   PUT /api/clinic/doctors/:id
// @access  Private (Clinic Admin)
const updateDoctor = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { id } = req.params;
    const { name, phone, email, specialization, qualifications, experience, consultationFee, slotDuration, bio, licenseNumber, availability } = req.body;

    const doctorUser = await User.findOne({ _id: id, clinicId, role: 'doctor' });
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: 'Doctor not found in this clinic' });
    }

    // Update user fields
    if (name) doctorUser.name = name;
    if (email !== undefined) doctorUser.email = email;
    await doctorUser.save();

    // Update doctor profile
    const profile = await DoctorProfile.findOne({ userId: id });
    if (profile) {
      if (specialization) profile.specialization = Array.isArray(specialization) ? specialization : [specialization];
      if (qualifications) profile.qualifications = Array.isArray(qualifications) ? qualifications : qualifications.split(',').map(q => q.trim());
      if (experience !== undefined) profile.experience = Number(experience);
      if (consultationFee !== undefined) profile.consultationFee = Number(consultationFee);
      if (slotDuration) profile.slotDuration = Number(slotDuration);
      if (bio !== undefined) profile.bio = bio;
      if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
      if (availability && Array.isArray(availability)) profile.availability = sanitizeAvailability(availability);
      await profile.save();
    }

    res.status(200).json({ success: true, message: 'Doctor updated successfully' });
  } catch (error) {
    console.error('Update Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update doctor', error: error.message });
  }
};

// @desc    Delete a doctor from this clinic
// @route   DELETE /api/clinic/doctors/:id
// @access  Private (Clinic Admin)
const deleteDoctor = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { id } = req.params;

    const doctorUser = await User.findOne({ _id: id, clinicId, role: 'doctor' });
    if (!doctorUser) {
      return res.status(404).json({ success: false, message: 'Doctor not found in this clinic' });
    }

    await DoctorProfile.deleteOne({ userId: id });
    await User.deleteOne({ _id: id });

    res.status(200).json({ success: true, message: 'Doctor removed from clinic' });
  } catch (error) {
    console.error('Delete Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete doctor', error: error.message });
  }
};

// @desc    Update a receptionist
// @route   PUT /api/clinic/receptionists/:id
// @access  Private (Clinic Admin)
const updateReceptionist = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { id } = req.params;
    const { name, email } = req.body;

    const receptionist = await User.findOne({ _id: id, clinicId, role: 'receptionist' });
    if (!receptionist) {
      return res.status(404).json({ success: false, message: 'Receptionist not found in this clinic' });
    }

    if (name) receptionist.name = name;
    if (email !== undefined) receptionist.email = email;
    await receptionist.save();

    res.status(200).json({ success: true, message: 'Receptionist updated successfully' });
  } catch (error) {
    console.error('Update Receptionist Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update receptionist', error: error.message });
  }
};

// @desc    Delete a receptionist
// @route   DELETE /api/clinic/receptionists/:id
// @access  Private (Clinic Admin)
const deleteReceptionist = async (req, res) => {
  try {
    const clinicId = req.user.clinicId;
    const { id } = req.params;

    const receptionist = await User.findOne({ _id: id, clinicId, role: 'receptionist' });
    if (!receptionist) {
      return res.status(404).json({ success: false, message: 'Receptionist not found in this clinic' });
    }

    await User.deleteOne({ _id: id });

    res.status(200).json({ success: true, message: 'Receptionist removed from clinic' });
  } catch (error) {
    console.error('Delete Receptionist Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete receptionist', error: error.message });
  }
};

module.exports = {
  // Super Admin
  createClinic,
  getAllClinics,
  updateClinic,
  toggleClinicActive,
  // Clinic Admin
  getClinicDashboard,
  addDoctor,
  addReceptionist,
  getClinicDoctors,
  getClinicReceptionists,
  updateDoctor,
  deleteDoctor,
  updateReceptionist,
  deleteReceptionist,
};
