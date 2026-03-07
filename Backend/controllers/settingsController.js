const PlatformSettings = require('../models/PlatformSettings');

// ==========================================
// @desc    Get all platform settings
// @route   GET /api/admin/settings
// @access  Private (Super Admin)
// ==========================================
const getSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    console.error('Get Settings Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private (Super Admin)
// ==========================================
const updateSettings = async (req, res) => {
  try {
    const {
      platformName, logoUrl, tagline, timezone, currency, currencySymbol,
      defaultSlotDuration, defaultConsultationFee, contactEmail, contactPhone, address,
      heroTitle, heroSubtitle, heroDescription, testimonials, faqs,
    } = req.body;

    const settings = await PlatformSettings.getSettings();

    // Platform Config
    if (platformName !== undefined) settings.platformName = platformName;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (tagline !== undefined) settings.tagline = tagline;
    if (timezone !== undefined) settings.timezone = timezone;
    if (currency !== undefined) settings.currency = currency;
    if (currencySymbol !== undefined) settings.currencySymbol = currencySymbol;
    if (defaultSlotDuration !== undefined) settings.defaultSlotDuration = defaultSlotDuration;
    if (defaultConsultationFee !== undefined) settings.defaultConsultationFee = defaultConsultationFee;
    if (contactEmail !== undefined) settings.contactEmail = contactEmail;
    if (contactPhone !== undefined) settings.contactPhone = contactPhone;
    if (address !== undefined) settings.address = address;

    // CMS fields
    if (heroTitle !== undefined) settings.heroTitle = heroTitle;
    if (heroSubtitle !== undefined) settings.heroSubtitle = heroSubtitle;
    if (heroDescription !== undefined) settings.heroDescription = heroDescription;
    if (testimonials !== undefined) settings.testimonials = testimonials;
    if (faqs !== undefined) settings.faqs = faqs;

    await settings.save();
    res.json({ success: true, settings, message: 'Settings updated successfully.' });
  } catch (err) {
    console.error('Update Settings Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// @desc    Create a broadcast notification
// @route   POST /api/admin/settings/broadcast
// @access  Private (Super Admin)
// ==========================================
const createBroadcast = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const settings = await PlatformSettings.getSettings();
    settings.broadcasts.unshift({ title, message, type: type || 'general' });
    await settings.save();

    res.status(201).json({ success: true, broadcast: settings.broadcasts[0], message: 'Broadcast sent successfully.' });
  } catch (err) {
    console.error('Create Broadcast Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// @desc    Get all broadcasts (paginated)
// @route   GET /api/admin/settings/broadcasts
// @access  Private (Super Admin)
// ==========================================
const getBroadcasts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const settings = await PlatformSettings.getSettings();
    const broadcasts = settings.broadcasts || [];

    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = broadcasts.slice(start, start + parseInt(limit));

    res.json({
      success: true,
      broadcasts: paginated,
      pagination: {
        total: broadcasts.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(broadcasts.length / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get Broadcasts Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// @desc    Delete a broadcast
// @route   DELETE /api/admin/settings/broadcast/:id
// @access  Private (Super Admin)
// ==========================================
const deleteBroadcast = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const index = settings.broadcasts.findIndex(b => b._id.toString() === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Broadcast not found.' });
    }

    settings.broadcasts.splice(index, 1);
    await settings.save();

    res.json({ success: true, message: 'Broadcast deleted.' });
  } catch (err) {
    console.error('Delete Broadcast Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  createBroadcast,
  getBroadcasts,
  deleteBroadcast,
};
