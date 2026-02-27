const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
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
} = require('../controllers/inventoryController');

// All routes require authentication
router.use(protect);

// --- Items ---
router.get('/items', authorize('clinic_admin', 'doctor', 'receptionist'), getItems);
router.get('/items/:id', authorize('clinic_admin', 'doctor'), getItem);
router.post('/items', authorize('clinic_admin'), createItem);
router.put('/items/:id', authorize('clinic_admin'), updateItem);
router.delete('/items/:id', authorize('clinic_admin'), deleteItem);

// --- Stock Movements ---
router.post('/stock', authorize('clinic_admin', 'doctor'), recordStockMovement);
router.get('/stock/:itemId', authorize('clinic_admin', 'doctor'), getMovementHistory);
router.post('/consume', authorize('doctor'), consumeItems);

// --- Vendors ---
router.get('/vendors', authorize('clinic_admin'), getVendors);
router.post('/vendors', authorize('clinic_admin'), createVendor);
router.put('/vendors/:id', authorize('clinic_admin'), updateVendor);
router.delete('/vendors/:id', authorize('clinic_admin'), deleteVendor);

// --- Alerts & Reports ---
router.get('/alerts', authorize('clinic_admin', 'doctor'), getAlerts);
router.get('/reports/ledger', authorize('clinic_admin'), getStockLedger);

module.exports = router;
