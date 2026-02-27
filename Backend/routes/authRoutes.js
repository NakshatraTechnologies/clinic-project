const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  sendOTP,
  verifyOTP,
  getMe,
  updateProfile,
  registerDoctor,
  createReceptionist,
  getMyReceptionists,
} = require('../controllers/authController');

// -------- Public Routes --------
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);

// -------- Protected Routes (Login required) --------
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

// -------- Doctor-specific Routes --------
router.post('/register-doctor', protect, registerDoctor);
router.post(
  '/create-receptionist',
  protect,
  authorize('doctor'),
  createReceptionist
);
router.get(
  '/my-receptionists',
  protect,
  authorize('doctor'),
  getMyReceptionists
);

module.exports = router;
