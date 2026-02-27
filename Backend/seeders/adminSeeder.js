const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Clinic = require('../models/Clinic');

/**
 * Seed default users and clinic into the database.
 * Only creates if they don't already exist (idempotent).
 *
 * Default Test Credentials:
 * ┌──────────────┬──────────────────┬──────────────────────┐
 * │ Role         │ Phone            │ Name                 │
 * ├──────────────┼──────────────────┼──────────────────────┤
 * │ Super Admin  │ 9999999999       │ Super Admin          │
 * │ Clinic Admin │ 9999999998       │ Clinic Admin         │
 * │ Doctor       │ 9876543210       │ Dr. Sharma           │
 * │ Receptionist │ 9876543211       │ Priya Verma          │
 * │ Patient      │ 9876543212       │ Rahul Kumar          │
 * └──────────────┴──────────────────┴──────────────────────┘
 *
 * Clinic: "Sharma Health Clinic" (linked to Clinic Admin)
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

    // ---- 2. Clinic Admin + Clinic ----
    let clinicAdmin = await User.findOne({ phone: '9999999998' });
    let clinic = await Clinic.findOne({ slug: 'sharma-health-clinic' });

    if (!clinicAdmin) {
      clinicAdmin = await User.create({
        name: 'Clinic Admin',
        phone: '9999999998',
        email: 'clinicadmin@clinic.com',
        role: 'clinic_admin',
        isPhoneVerified: true,
        isVerified: true,
        isActive: true,
        createdBy: admin._id,
      });

      if (!clinic) {
        clinic = await Clinic.create({
          name: 'Sharma Health Clinic',
          ownerId: clinicAdmin._id,
          phone: '9999999998',
          email: 'clinicadmin@clinic.com',
          address: {
            street: 'MG Road',
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452001',
          },
          description: 'A multi-specialty health clinic providing quality healthcare.',
          subscriptionPlan: 'professional',
          subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }

      // Link clinic admin to clinic
      clinicAdmin.clinicId = clinic._id;
      await clinicAdmin.save();

      console.log('✅ Clinic Admin created (Phone: 9999999998)');
      console.log('✅ Clinic created: Sharma Health Clinic');
    } else {
      // Ensure clinic exists
      if (!clinic) {
        clinic = await Clinic.findOne({ ownerId: clinicAdmin._id });
      }
      console.log('ℹ️  Clinic Admin already exists');
    }

    // ---- 3. Sample Doctor (linked to clinic) ----
    let doctor = await User.findOne({ phone: '9876543210' });
    if (!doctor) {
      doctor = await User.create({
        name: 'Dr. Sharma',
        phone: '9876543210',
        email: 'dr.sharma@clinic.com',
        role: 'doctor',
        clinicId: clinic ? clinic._id : null,
        isPhoneVerified: true,
        isVerified: true,
        isActive: true,
        gender: 'male',
        createdBy: clinicAdmin ? clinicAdmin._id : null,
      });

      // Create DoctorProfile
      await DoctorProfile.create({
        userId: doctor._id,
        clinicId: clinic ? clinic._id : null,
        specialization: ['General Physician', 'Internal Medicine'],
        qualifications: ['MBBS', 'MD'],
        experience: 10,
        consultationFee: 500,
        slotDuration: 15,
        bio: 'Dr. Sharma is an experienced General Physician with 10 years of practice.',
        clinicName: 'Sharma Clinic',
        clinicAddress: {
          street: 'MG Road',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
        },
        isApproved: true,
        availability: [
          {
            day: 'monday',
            isAvailable: true,
            slots: [
              { startTime: '10:00', endTime: '14:00' },
              { startTime: '17:00', endTime: '21:00' },
            ],
          },
          {
            day: 'tuesday',
            isAvailable: true,
            slots: [
              { startTime: '10:00', endTime: '14:00' },
              { startTime: '17:00', endTime: '21:00' },
            ],
          },
          {
            day: 'wednesday',
            isAvailable: true,
            slots: [
              { startTime: '10:00', endTime: '14:00' },
              { startTime: '17:00', endTime: '21:00' },
            ],
          },
          {
            day: 'thursday',
            isAvailable: true,
            slots: [
              { startTime: '10:00', endTime: '14:00' },
              { startTime: '17:00', endTime: '21:00' },
            ],
          },
          {
            day: 'friday',
            isAvailable: true,
            slots: [
              { startTime: '10:00', endTime: '14:00' },
              { startTime: '17:00', endTime: '21:00' },
            ],
          },
          {
            day: 'saturday',
            isAvailable: true,
            slots: [{ startTime: '10:00', endTime: '14:00' }],
          },
          {
            day: 'sunday',
            isAvailable: false,
            slots: [],
          },
        ],
      });

      console.log('✅ Doctor created (Phone: 9876543210) — Dr. Sharma');
    } else {
      // Update existing doctor with clinicId if missing
      if (!doctor.clinicId && clinic) {
        doctor.clinicId = clinic._id;
        await doctor.save();

        const profile = await DoctorProfile.findOne({ userId: doctor._id });
        if (profile && !profile.clinicId) {
          profile.clinicId = clinic._id;
          await profile.save();
        }
        console.log('ℹ️  Doctor already exists — linked to clinic');
      } else {
        console.log('ℹ️  Doctor already exists');
      }
    }

    // ---- 4. Sample Receptionist (linked to clinic + doctor) ----
    let receptionist = await User.findOne({ phone: '9876543211' });
    if (!receptionist) {
      const doctorUser = await User.findOne({ phone: '9876543210' });
      receptionist = await User.create({
        name: 'Priya Verma',
        phone: '9876543211',
        email: 'priya@clinic.com',
        role: 'receptionist',
        clinicId: clinic ? clinic._id : null,
        isPhoneVerified: true,
        isActive: true,
        createdBy: doctorUser ? doctorUser._id : null,
        gender: 'female',
      });
      console.log('✅ Receptionist created (Phone: 9876543211) — Priya Verma');
    } else {
      // Update existing receptionist with clinicId if missing
      if (!receptionist.clinicId && clinic) {
        receptionist.clinicId = clinic._id;
        await receptionist.save();
        console.log('ℹ️  Receptionist already exists — linked to clinic');
      } else {
        console.log('ℹ️  Receptionist already exists');
      }
    }

    // ---- 5. Sample Patient ----
    let patient = await User.findOne({ phone: '9876543212' });
    if (!patient) {
      patient = await User.create({
        name: 'Rahul Kumar',
        phone: '9876543212',
        email: 'rahul@gmail.com',
        role: 'patient',
        isPhoneVerified: true,
        isActive: true,
        gender: 'male',
        dateOfBirth: new Date('1995-06-15'),
        bloodGroup: 'B+',
        address: {
          city: 'Indore',
          state: 'Madhya Pradesh',
          pincode: '452001',
        },
      });
      console.log('✅ Patient created (Phone: 9876543212) — Rahul Kumar');
    } else {
      console.log('ℹ️  Patient already exists');
    }

    console.log('🌱 Seed check complete!\n');
  } catch (error) {
    console.error('❌ Seed Error:', error.message);
  }
};

module.exports = seedDefaultUsers;
