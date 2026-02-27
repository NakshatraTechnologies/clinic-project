const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // The clinic_admin who owns/manages this clinic
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    // GeoJSON for map-based clinic search
    location: {
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
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Super Admin can deactivate an entire clinic
    isActive: {
      type: Boolean,
      default: true,
    },
    // Subscription — now at clinic level (moved from DoctorProfile)
    subscriptionPlan: {
      type: String,
      enum: ['free', 'professional', 'enterprise'],
      default: 'free',
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
clinicSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
// clinicSchema.index({ slug: 1 }); // Removed duplicate index
clinicSchema.index({ ownerId: 1 });
clinicSchema.index({ isActive: 1 });
clinicSchema.index({ location: '2dsphere' });
clinicSchema.index({ 'address.city': 1 });

module.exports = mongoose.model('Clinic', clinicSchema);
