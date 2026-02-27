const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

const {
  getAdminDashboard,
  getAllDoctors,
  verifyDoctor,
  getAllUsers,
  toggleUserActive,
} = require('../controllers/adminController');

const {
  createClinic,
  getAllClinics,
  updateClinic,
  toggleClinicActive,
} = require('../controllers/clinicController');

// All routes require Super Admin role
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Clinic management (Super Admin creates/manages clinics)
router.post('/clinics', createClinic);
router.get('/clinics', getAllClinics);
router.put('/clinics/:id', updateClinic);
router.put('/clinics/:id/toggle', toggleClinicActive);

// Doctor overview (platform-level, read-only + verify)
router.get('/doctors', getAllDoctors);
router.put('/doctors/:doctorId/verify', verifyDoctor);

// User management
router.get('/users', getAllUsers);
router.put('/users/:userId/toggle-active', toggleUserActive);

module.exports = router;
