const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  walkInEntry,
  collectPayment,
  getTodaySummary,
} = require('../controllers/receptionistController');

// All routes require receptionist or doctor role
router.use(protect, authorize('receptionist', 'doctor'));

router.post('/walk-in', walkInEntry);
router.put('/collect-payment/:appointmentId', collectPayment);
router.get('/today-summary', getTodaySummary);

module.exports = router;
