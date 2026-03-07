const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, default: '', trim: true },
  text: { type: String, required: true, trim: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
});

const broadcastSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['info', 'warning', 'maintenance', 'update', 'general'],
    default: 'general',
  },
  createdAt: { type: Date, default: Date.now },
});

const platformSettingsSchema = new mongoose.Schema(
  {
    // Singleton key — always _id = 'platform'
    _id: { type: String, default: 'platform' },

    // ===== Platform Config =====
    platformName: { type: String, default: 'Nakshatra Clinic', trim: true },
    logoUrl: { type: String, default: '', trim: true },
    tagline: { type: String, default: 'Your Health, Our Priority', trim: true },
    timezone: { type: String, default: 'Asia/Kolkata', trim: true },
    currency: { type: String, default: 'INR', trim: true },
    currencySymbol: { type: String, default: '₹', trim: true },
    defaultSlotDuration: { type: Number, default: 15 },  // minutes
    defaultConsultationFee: { type: Number, default: 500 },
    contactEmail: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },

    // ===== CMS — Landing Page =====
    heroTitle: { type: String, default: 'Find & Book Your Doctor', trim: true },
    heroSubtitle: { type: String, default: 'Hassle-free appointments at top clinics near you', trim: true },
    heroDescription: { type: String, default: '', trim: true },
    testimonials: [testimonialSchema],
    faqs: [faqSchema],

    // ===== Broadcasts =====
    broadcasts: [broadcastSchema],
  },
  {
    timestamps: true,
    _id: false,  // we manage _id ourselves
  }
);

// Static method to get or create the singleton
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findById('platform');
  if (!settings) {
    settings = await this.create({ _id: 'platform' });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
