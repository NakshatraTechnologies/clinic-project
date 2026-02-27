const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  getDashboardStats,
  getMyDoctorProfile,
  updateDoctorProfile,
  getMyPatients,
  getPatientRecords,
} = require('../controllers/doctorController');

// All routes require doctor role
router.use(protect, authorize('doctor'));

router.get('/dashboard', getDashboardStats);
router.get('/profile', getMyDoctorProfile);
router.put('/profile', updateDoctorProfile);
router.get('/patients', getMyPatients);
router.get('/patients/:patientId/records', getPatientRecords);

module.exports = router;
