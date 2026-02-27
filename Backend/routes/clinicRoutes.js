const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  getClinicDashboard,
  addDoctor,
  addReceptionist,
  getClinicDoctors,
  getClinicReceptionists,
  updateDoctor,
  deleteDoctor,
  updateReceptionist,
  deleteReceptionist,
} = require('../controllers/clinicController');

// All routes require auth
router.use(protect);

// Clinic Admin dashboard
router.get('/dashboard', authorize('clinic_admin'), getClinicDashboard);

// Doctor management (clinic_admin only)
router.post('/doctors', authorize('clinic_admin'), addDoctor);
router.get('/doctors', authorize('clinic_admin'), getClinicDoctors);
router.put('/doctors/:id', authorize('clinic_admin'), updateDoctor);
router.delete('/doctors/:id', authorize('clinic_admin'), deleteDoctor);

// Receptionist management (clinic_admin or doctor)
router.post('/receptionists', authorize('clinic_admin', 'doctor'), addReceptionist);
router.get('/receptionists', authorize('clinic_admin'), getClinicReceptionists);
router.put('/receptionists/:id', authorize('clinic_admin'), updateReceptionist);
router.delete('/receptionists/:id', authorize('clinic_admin'), deleteReceptionist);

module.exports = router;
