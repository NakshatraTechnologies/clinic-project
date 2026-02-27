const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  createPrescription,
  updatePrescription,
  getPrescription,
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  downloadPrescriptionPDF,
  getDoctorPrescriptions,
} = require('../controllers/prescriptionController');

// All routes require authentication
router.use(protect);

// Doctor-only routes
router.post('/', authorize('doctor'), createPrescription);
router.put('/:id', authorize('doctor'), updatePrescription);
router.get('/doctor/all', authorize('doctor'), getDoctorPrescriptions);

// Doctor + Patient routes
router.get('/:id', getPrescription);
router.get('/:id/pdf', downloadPrescriptionPDF);
router.get('/appointment/:appointmentId', getPrescriptionByAppointment);
router.get('/patient/:patientId', getPatientPrescriptions);

module.exports = router;
