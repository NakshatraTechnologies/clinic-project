const User = require('../models/User');

/**
 * Seed default users and clinic into the database.
 * Only creates if they don't already exist (idempotent).
 *
 * Default Test Credentials:
 * ┌──────────────┬──────────────────┬──────────────────────┐
 * │ Role         │ Phone            │ Name                 │
 * ├──────────────┼──────────────────┼──────────────────────┤
 * │ Super Admin  │ 9999999999       │ Super Admin          │
 * └──────────────┴──────────────────┴──────────────────────┘
 *
 * Login: Send OTP to any of these numbers → Verify OTP → Get Token
 */
const seedDefaultUsers = async () => {
  try {
    console.log('🌱 Checking seed data...');

    // ---- 1. Super Admin ----
    let admin = await User.findOne({ phone: '9999999999' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        phone: '9999999999',
        email: 'admin@clinic.com',
        role: 'admin',
        isPhoneVerified: true,
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Super Admin created (Phone: 9999999999)');
    } else {
      console.log('ℹ️  Super Admin already exists');
    }

    console.log('🌱 Seed check complete!\n');
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
  }
};

module.exports = seedDefaultUsers;
