const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  otp: {
    type: String,
    required: [true, 'OTP is required'],
  },
  purpose: {
    type: String,
    enum: ['login', 'register', 'reset'],
    default: 'login',
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index: auto-delete when expired
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick lookup
otpSchema.index({ phone: 1, otp: 1 });

module.exports = mongoose.model('OTP', otpSchema);
