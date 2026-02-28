const User = require('../models/User');
const OTP = require('../models/OTP');
const DoctorProfile = require('../models/DoctorProfile');
const Clinic = require('../models/Clinic');
const generateToken = require('../utils/generateToken');

// ==========================================
// @desc    Send OTP to phone number
// @route   POST /api/auth/send-otp
// @access  Public
// ==========================================
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Validate Indian phone number
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian phone number',
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing unused OTPs for this phone
    await OTP.deleteMany({ phone, isUsed: false });

    // Save OTP with 5-minute expiry
    const otp = await OTP.create({
      phone,
      otp: otpCode,
      purpose: 'login',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    // =====================================================
    // TODO: Integrate with actual SMS/WhatsApp API later
    // For now, OTP is logged to console for development
    // =====================================================
    console.log(`\n📱 OTP for ${phone}: ${otpCode}\n`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // Since there is no real SMS service integrated yet, always send OTP in response so it's visible on frontend
      // TODO: Remove this once a real SMS service is integrated, or restrict to development only
      otp: otpCode,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Verify OTP & Login/Register
// @route   POST /api/auth/verify-otp
// @access  Public
// ==========================================
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required',
      });
    }

    // Find valid OTP
    const otpRecord = await OTP.findOne({
      phone,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Check if user exists
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      // New user — create with patient role by default
      user = await User.create({
        name: '',
        phone,
        role: 'patient',
        isPhoneVerified: true,
        isActive: true,
      });
      isNewUser = true;
    } else {
      // Existing user — mark phone as verified
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await user.save();
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Contact admin.',
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Build user response — include clinicId for tenant-scoped roles
    const userResponse = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isPhoneVerified: user.isPhoneVerified,
      avatar: user.avatar,
      clinicId: user.clinicId || null,
    };

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ==========================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('clinicId', 'name slug isActive subscriptionPlan subscriptionExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If doctor, also fetch DoctorProfile
    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ userId: user._id });
    }

    // If clinic_admin, fetch clinic details
    let clinic = null;
    if (user.role === 'clinic_admin' && user.clinicId) {
      clinic = await Clinic.findById(user.clinicId);
    }

    res.status(200).json({
      success: true,
      user,
      ...(doctorProfile && { doctorProfile }),
      ...(clinic && { clinic }),
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
// ==========================================
const updateProfile = async (req, res) => {
  try {
    const { name, email, dateOfBirth, gender, address, bloodGroup, allergies } =
      req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (address) user.address = { ...user.address, ...address };
    if (bloodGroup) user.bloodGroup = bloodGroup;
    if (allergies) user.allergies = allergies;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Register as Doctor (after OTP login)
// @route   POST /api/auth/register-doctor
// @access  Private (patient upgrading to doctor)
// ==========================================
const registerDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      specialization,
      qualifications,
      experience,
      consultationFee,
      slotDuration,
      bio,
      clinicName,
      clinicAddress,
      clinicLocation,
      licenseNumber,
      availability,
    } = req.body;

    // Validate required fields
    if (!name || !specialization || !consultationFee) {
      return res.status(400).json({
        success: false,
        message: 'Name, specialization, and consultation fee are required',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already a doctor
    if (user.role === 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'You are already registered as a doctor',
      });
    }

    // Upgrade role to doctor
    user.role = 'doctor';
    user.name = name;
    if (email) user.email = email;
    await user.save();

    // Create DoctorProfile
    const doctorProfile = await DoctorProfile.create({
      userId: user._id,
      specialization: Array.isArray(specialization)
        ? specialization
        : [specialization],
      qualifications: qualifications || [],
      experience: experience || 0,
      consultationFee,
      slotDuration: slotDuration || 15,
      bio: bio || '',
      clinicName: clinicName || '',
      clinicAddress: clinicAddress || {},
      clinicLocation: clinicLocation || { type: 'Point', coordinates: [0, 0] },
      licenseNumber: licenseNumber || '',
      availability: availability || [],
    });

    res.status(201).json({
      success: true,
      message:
        'Doctor registration successful. Awaiting admin verification.',
      user,
      doctorProfile,
    });
  } catch (error) {
    console.error('Register Doctor Error:', error);
    res.status(500).json({
      success: false,
      message: 'Doctor registration failed',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Create Receptionist account (by Doctor)
// @route   POST /api/auth/create-receptionist
// @access  Private (Doctor only)
// ==========================================
const createReceptionist = async (req, res) => {
  try {
    const { name, phone, email } = req.body;

    // Doctors and clinic_admins can create receptionists
    if (!['doctor', 'clinic_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and clinic admins can create receptionist accounts',
      });
    }

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

    // Create receptionist account with clinic context
    const receptionist = await User.create({
      name,
      phone,
      email: email || '',
      role: 'receptionist',
      clinicId: req.user.clinicId || null,
      createdBy: req.user._id,
      isPhoneVerified: true, // Created by staff, so no OTP needed
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Receptionist account created successfully',
      receptionist: {
        _id: receptionist._id,
        name: receptionist.name,
        phone: receptionist.phone,
        email: receptionist.email,
        role: receptionist.role,
        createdBy: receptionist.createdBy,
      },
    });
  } catch (error) {
    console.error('Create Receptionist Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create receptionist',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get all receptionists (created by doctor)
// @route   GET /api/auth/my-receptionists
// @access  Private (Doctor only)
// ==========================================
const getMyReceptionists = async (req, res) => {
  try {
    if (!['doctor', 'clinic_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only doctors and clinic admins can view receptionists',
      });
    }

    // Doctor sees their own receptionists; clinic_admin sees all in clinic
    let filter = { role: 'receptionist' };
    if (req.user.role === 'doctor') {
      filter.createdBy = req.user._id;
    } else if (req.user.clinicId) {
      filter.clinicId = req.user.clinicId;
    }

    const receptionists = await User.find(filter).select('-password');

    res.status(200).json({
      success: true,
      count: receptionists.length,
      receptionists,
    });
  } catch (error) {
    console.error('Get Receptionists Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get receptionists',
      error: error.message,
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  getMe,
  updateProfile,
  registerDoctor,
  createReceptionist,
  getMyReceptionists,
};
