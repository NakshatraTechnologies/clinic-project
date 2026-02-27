const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  createException,
  getMyExceptions,
  getDoctorExceptions,
  deleteException,
} = require('../controllers/exceptionController');

// -------- Public Route --------
// Anyone can view a doctor's future exceptions (to know when they're unavailable)
router.get('/:doctorId', getDoctorExceptions);

// -------- Doctor-only Routes --------
router.post('/', protect, authorize('doctor'), createException);
router.get('/', protect, authorize('doctor'), getMyExceptions);
router.delete('/:id', protect, authorize('doctor'), deleteException);

module.exports = router;
