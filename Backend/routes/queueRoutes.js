const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  getTodayQueue,
  checkInPatient,
  updateQueuePatientStatus,
  callNextPatient,
} = require('../controllers/queueController');

// All routes require doctor or receptionist role
router.use(protect, authorize('doctor', 'receptionist'));

router.get('/today', getTodayQueue);
router.post('/check-in', checkInPatient);
router.put('/patient/:appointmentId/status', updateQueuePatientStatus);
router.put('/next', callNextPatient);

module.exports = router;
