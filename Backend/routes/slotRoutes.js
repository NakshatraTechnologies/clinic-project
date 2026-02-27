const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  updateAvailability,
  getAvailability,
  getSlots,
} = require('../controllers/slotController');

// -------- Public Routes --------
// Anyone can view doctor's availability and slots
router.get('/availability/:doctorId', getAvailability);
router.get('/summary/:doctorId', require('../controllers/slotController').getAvailabilitySummary);
router.get('/:doctorId/:date', getSlots); // date format: YYYY-MM-DD

// -------- Doctor-only Routes --------
router.put(
  '/availability',
  protect,
  authorize('doctor'),
  updateAvailability
);

module.exports = router;
