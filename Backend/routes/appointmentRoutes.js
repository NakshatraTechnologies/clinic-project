const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentAudit,
} = require('../controllers/appointmentController');

// -------- Patient Routes --------
router.post('/book', protect, bookAppointment);
router.get('/my', protect, getMyAppointments);

// -------- Cancel (Patient, Doctor, Receptionist) --------
router.put('/:id/cancel', protect, cancelAppointment);

// -------- Reschedule (Patient, Doctor, Receptionist) --------
router.put('/:id/reschedule', protect, rescheduleAppointment);

// -------- Audit Log (Doctor, Admin) --------
router.get('/:id/audit', protect, getAppointmentAudit);

// -------- Doctor / Receptionist Routes --------
router.get(
  '/doctor',
  protect,
  authorize('doctor', 'receptionist'),
  getDoctorAppointments
);

router.put(
  '/:id/status',
  protect,
  authorize('doctor', 'receptionist'),
  updateAppointmentStatus
);

module.exports = router;
