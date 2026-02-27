const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Multiple time slots per day (e.g., morning 10-2 and evening 5-9)
    slots: [
      {
        startTime: {
          type: String,
          required: true, // Format: "HH:mm" (24hr)
        },
        endTime: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    // Multi-tenant: which clinic this doctor belongs to
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
    },
    specialization: {
      type: [String],
      required: [true, 'At least one specialization is required'],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one specialization is required',
      },
    },
    qualifications: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    slotDuration: {
      type: Number,
      default: 15, // in minutes (15 or 30)
      enum: [10, 15, 20, 30, 45, 60],
    },
    // Buffer time (minutes) between consecutive appointments
    bufferTime: {
      type: Number,
      default: 0,
      enum: [0, 5, 10, 15],
    },
    // Timezone for this doctor's schedule
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    // Reschedule policy
    maxReschedules: {
      type: Number,
      default: 2, // max times a patient can reschedule one appointment
    },
    minRescheduleHours: {
      type: Number,
      default: 2, // minimum hours before appointment to allow reschedule
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    // Clinic Details
    clinicName: {
      type: String,
      default: '',
    },
    clinicAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    // GeoJSON for Google Maps (2dsphere index for location-based search)
    clinicLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    clinicPhotos: {
      type: [String],
      default: [],
    },
    // License & Verification
    licenseNumber: {
      type: String,
      default: '',
    },
    licenseDocument: {
      type: String, // URL to uploaded document
      default: '',
    },
    // Weekly availability schedule
    availability: {
      type: [availabilitySchema],
      default: [],
    },
    // Ratings
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Note: Subscription has been moved to Clinic level
    // Admin approval
    isApproved: {
      type: Boolean,
      default: false,
    },
    // QR Code
    qrCode: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location-based doctor search
doctorProfileSchema.index({ clinicLocation: '2dsphere' });

// Index for search & filter
doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ 'clinicAddress.city': 1 });
doctorProfileSchema.index({ consultationFee: 1 });
doctorProfileSchema.index({ rating: -1 });
doctorProfileSchema.index({ isApproved: 1 });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
