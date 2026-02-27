const InventoryItem = require('../models/InventoryItem');
const StockMovement = require('../models/StockMovement');
const Vendor = require('../models/Vendor');
const Clinic = require('../models/Clinic');
const User = require('../models/User');

// Helper: get clinicId from user
const getClinicId = async (user) => {
  if (user.role === 'clinic_admin') {
    const clinic = await Clinic.findOne({ ownerId: user._id });
    return clinic?._id || null;
  }
  // Doctors and receptionists have clinicId on their profile or user doc
  if (user.clinicId) return user.clinicId;
  // Fallback: check DoctorProfile
  const DoctorProfile = require('../models/DoctorProfile');
  const profile = await DoctorProfile.findOne({ userId: user._id });
  return profile?.clinicId || null;
};

// ==========================================
// INVENTORY ITEMS
// ==========================================

// @desc    Get all inventory items
// @route   GET /api/inventory/items
// @access  Private (clinic_admin, doctor, receptionist)
const getItems = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found for user' });

    const { category, search, lowStock, nearExpiry, page = 1, limit = 50 } = req.query;
    const filter = { clinicId, isActive: true };

    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (lowStock === 'true') filter.$expr = { $lte: ['$stockQty', '$reorderLevel'] };
    if (nearExpiry === 'true') {
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      filter.expiryDate = { $ne: null, $lte: thirtyDays, $gte: new Date() };
    }

    const items = await InventoryItem.find(filter)
      .populate('vendor', 'name phone')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await InventoryItem.countDocuments(filter);

    res.json({
      success: true,
      count: items.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      items,
    });
  } catch (error) {
    console.error('Get Items Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single inventory item with recent movements
// @route   GET /api/inventory/items/:id
// @access  Private (clinic_admin, doctor)
const getItem = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const item = await InventoryItem.findOne({ _id: req.params.id, clinicId })
      .populate('vendor', 'name phone email');

    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const recentMovements = await StockMovement.find({ itemId: item._id, clinicId })
      .populate('performedBy', 'name')
      .sort({ date: -1 })
      .limit(20);

    res.json({ success: true, item, recentMovements });
  } catch (error) {
    console.error('Get Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory/items
// @access  Private (clinic_admin)
const createItem = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const item = await InventoryItem.create({ ...req.body, clinicId });
    res.status(201).json({ success: true, message: 'Item created successfully', item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An item with this SKU already exists in your clinic' });
    }
    console.error('Create Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/items/:id
// @access  Private (clinic_admin)
const updateItem = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    // Don't allow direct stockQty updates (must go through movements)
    delete req.body.stockQty;
    delete req.body.clinicId;

    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item updated successfully', item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An item with this SKU already exists' });
    }
    console.error('Update Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Soft-delete inventory item
// @route   DELETE /api/inventory/items/:id
// @access  Private (clinic_admin)
const deleteItem = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const item = await InventoryItem.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      { isActive: false },
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// STOCK MOVEMENTS
// ==========================================

// @desc    Record a stock movement (purchase, adjustment, return)
// @route   POST /api/inventory/stock
// @access  Private (clinic_admin, doctor)
const recordStockMovement = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const { itemId, type, quantity, unitCost, reference, notes, batchNo } = req.body;

    if (!itemId || !type || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'itemId, type, and quantity are required' });
    }

    const item = await InventoryItem.findOne({ _id: itemId, clinicId, isActive: true });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // Determine stock change
    let stockChange = Math.abs(quantity);
    if (type === 'consumption' || type === 'return') {
      stockChange = -stockChange;
    }
    if (type === 'adjustment') {
      stockChange = quantity; // Can be positive or negative
    }

    // Check sufficient stock for outgoing
    if (stockChange < 0 && item.stockQty + stockChange < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current: ${item.stockQty}, Requested: ${Math.abs(stockChange)}`,
      });
    }

    // Create movement
    const movement = await StockMovement.create({
      clinicId,
      itemId,
      type,
      quantity: stockChange,
      unitCost: unitCost || item.purchasePrice,
      reference: reference || '',
      performedBy: req.user._id,
      notes: notes || '',
      batchNo: batchNo || '',
    });

    // Update item stock
    item.stockQty += stockChange;
    if (batchNo) item.batchNo = batchNo;
    await item.save();

    res.status(201).json({
      success: true,
      message: `Stock ${type} recorded. New quantity: ${item.stockQty}`,
      movement,
      newStockQty: item.stockQty,
    });
  } catch (error) {
    console.error('Stock Movement Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get movement history for an item
// @route   GET /api/inventory/stock/:itemId
// @access  Private (clinic_admin, doctor)
const getMovementHistory = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const { page = 1, limit = 30 } = req.query;

    const movements = await StockMovement.find({ itemId: req.params.itemId, clinicId })
      .populate('performedBy', 'name')
      .populate('appointmentId', 'date startTime')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await StockMovement.countDocuments({ itemId: req.params.itemId, clinicId });

    res.json({ success: true, movements, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Movement History Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Consume items during appointment (batch)
// @route   POST /api/inventory/consume
// @access  Private (doctor)
const consumeItems = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const { items, appointmentId } = req.body;
    // items = [{ itemId, quantity, notes }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items array is required' });
    }

    const results = [];

    for (const entry of items) {
      const item = await InventoryItem.findOne({ _id: entry.itemId, clinicId, isActive: true });
      if (!item) {
        results.push({ itemId: entry.itemId, error: 'Item not found' });
        continue;
      }

      const qty = Math.abs(entry.quantity || 1);
      if (item.stockQty < qty) {
        results.push({ itemId: entry.itemId, name: item.name, error: `Insufficient stock (have ${item.stockQty}, need ${qty})` });
        continue;
      }

      await StockMovement.create({
        clinicId,
        itemId: item._id,
        type: 'consumption',
        quantity: -qty,
        unitCost: item.purchasePrice,
        appointmentId: appointmentId || null,
        performedBy: req.user._id,
        notes: entry.notes || 'Consumed during appointment',
      });

      item.stockQty -= qty;
      await item.save();

      results.push({ itemId: item._id, name: item.name, consumed: qty, newStock: item.stockQty });
    }

    res.json({ success: true, message: 'Consumption recorded', results });
  } catch (error) {
    console.error('Consume Items Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// VENDORS
// ==========================================

// @desc    Get all vendors
// @route   GET /api/inventory/vendors
// @access  Private (clinic_admin)
const getVendors = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const vendors = await Vendor.find({ clinicId, isActive: true }).sort({ name: 1 });
    res.json({ success: true, vendors });
  } catch (error) {
    console.error('Get Vendors Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create vendor
// @route   POST /api/inventory/vendors
// @access  Private (clinic_admin)
const createVendor = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const vendor = await Vendor.create({ ...req.body, clinicId });
    res.status(201).json({ success: true, message: 'Vendor created', vendor });
  } catch (error) {
    console.error('Create Vendor Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update vendor
// @route   PUT /api/inventory/vendors/:id
// @access  Private (clinic_admin)
const updateVendor = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    delete req.body.clinicId;
    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor updated', vendor });
  } catch (error) {
    console.error('Update Vendor Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete vendor (soft)
// @route   DELETE /api/inventory/vendors/:id
// @access  Private (clinic_admin)
const deleteVendor = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, clinicId },
      { isActive: false },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    console.error('Delete Vendor Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// ALERTS & REPORTS
// ==========================================

// @desc    Get alerts (low stock + near expiry)
// @route   GET /api/inventory/alerts
// @access  Private (clinic_admin, doctor)
const getAlerts = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    // Low stock: qty <= reorderLevel
    const lowStock = await InventoryItem.find({
      clinicId,
      isActive: true,
      $expr: { $lte: ['$stockQty', '$reorderLevel'] },
    })
      .populate('vendor', 'name')
      .sort({ stockQty: 1 })
      .limit(50);

    // Near expiry: within 30 days
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const nearExpiry = await InventoryItem.find({
      clinicId,
      isActive: true,
      category: 'medicine',
      expiryDate: { $ne: null, $lte: thirtyDays, $gte: new Date() },
    })
      .sort({ expiryDate: 1 })
      .limit(50);

    // Already expired
    const expired = await InventoryItem.find({
      clinicId,
      isActive: true,
      expiryDate: { $ne: null, $lt: new Date() },
    })
      .sort({ expiryDate: 1 })
      .limit(50);

    res.json({
      success: true,
      alerts: {
        lowStock,
        nearExpiry,
        expired,
        lowStockCount: lowStock.length,
        nearExpiryCount: nearExpiry.length,
        expiredCount: expired.length,
      },
    });
  } catch (error) {
    console.error('Get Alerts Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Stock ledger report
// @route   GET /api/inventory/reports/ledger
// @access  Private (clinic_admin)
const getStockLedger = async (req, res) => {
  try {
    const clinicId = await getClinicId(req.user);
    if (!clinicId) return res.status(400).json({ success: false, message: 'Clinic not found' });

    const { from, to, itemId, type, page = 1, limit = 50 } = req.query;
    const filter = { clinicId };

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to + 'T23:59:59.999Z');
    }
    if (itemId) filter.itemId = itemId;
    if (type) filter.type = type;

    const movements = await StockMovement.find(filter)
      .populate('itemId', 'name sku category unit')
      .populate('performedBy', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await StockMovement.countDocuments(filter);

    // Summary stats
    const summary = await StockMovement.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          totalQty: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      movements,
      total,
      totalPages: Math.ceil(total / limit),
      summary,
    });
  } catch (error) {
    console.error('Stock Ledger Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  recordStockMovement,
  getMovementHistory,
  consumeItems,
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
  getAlerts,
  getStockLedger,
};
