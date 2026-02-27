import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth APIs
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/update-profile', data);

// Slot / Doctor APIs
export const getDoctorSlots = (doctorId, date) => api.get(`/slots/${doctorId}/${date}`);
export const getDoctorSlotSummary = (doctorId) => api.get(`/slots/summary/${doctorId}`);
export const getDoctorAvailability = (doctorId) => api.get(`/slots/availability/${doctorId}`);

// Appointment APIs
export const bookAppointment = (data) => api.post('/appointments/book', data);
export const getMyAppointments = (params) => api.get('/appointments/my', { params });
export const cancelAppointment = (id, reason) => api.put(`/appointments/${id}/cancel`, { reason });

// Prescription APIs
export const getMyPrescriptions = (patientId, params) => api.get(`/prescriptions/patient/${patientId}`, { params });
export const getPrescription = (id) => api.get(`/prescriptions/${id}`);
export const downloadPrescriptionPDF = (id) => `${API_BASE}/prescriptions/${id}/pdf`;

// Search doctors (public endpoint, no auth needed)
export const searchDoctors = (params) => api.get('/public/doctors', { params });
export const getDoctorById = (id) => api.get(`/public/doctors/${id}`);

// Patient Dashboard Stats
export const getPatientStats = () => api.get('/appointments/stats');

// ========== Doctor Dashboard APIs ==========
export const getDoctorDashboard = () => api.get('/doctors/dashboard');
export const getDoctorProfile = () => api.get('/doctors/profile');
export const updateDoctorProfile = (data) => api.put('/doctors/profile', data);
export const getDoctorPatients = (params) => api.get('/doctors/patients', { params });
export const getPatientRecords = (doctorId, patientId) => api.get(`/doctors/patients/${patientId}/records`);

// Doctor Appointment APIs
export const getDoctorAppointments = (params) => api.get('/appointments/doctor', { params });
export const updateAppointmentStatus = (id, status) => api.put(`/appointments/${id}/status`, { status });

// Doctor Slot APIs
export const updateAvailability = (data) => api.put('/slots/availability', data);

// Doctor Prescription APIs
export const createPrescription = (data) => api.post('/prescriptions', data);
export const getDoctorPrescriptions = (params) => api.get('/prescriptions/doctor/all', { params });
export const getPrescriptionByAppointment = (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`);

// Receptionist APIs (for doctor)
export const createReceptionist = (data) => api.post('/auth/create-receptionist', data);
export const getMyReceptionists = () => api.get('/auth/my-receptionists');

// ========== Super Admin APIs ==========
export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getAdminClinics = (params) => api.get('/admin/clinics', { params });
export const adminCreateClinic = (data) => api.post('/admin/clinics', data);
export const adminUpdateClinic = (id, data) => api.put(`/admin/clinics/${id}`, data);
export const adminToggleClinic = (id) => api.put(`/admin/clinics/${id}/toggle`);
export const getAdminDoctors = (params) => api.get('/admin/doctors', { params });
export const adminVerifyDoctor = (doctorId, isApproved) => api.put(`/admin/doctors/${doctorId}/verify`, { isApproved });
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const adminToggleUser = (userId) => api.put(`/admin/users/${userId}/toggle-active`);

// ========== Clinic Admin APIs ==========
export const getClinicDashboard = () => api.get('/clinic/dashboard');
export const getClinicDoctors = (params) => api.get('/clinic/doctors', { params });
export const addClinicDoctor = (data) => api.post('/clinic/doctors', data);
export const updateClinicDoctor = (id, data) => api.put(`/clinic/doctors/${id}`, data);
export const deleteClinicDoctor = (id) => api.delete(`/clinic/doctors/${id}`);
export const getClinicReceptionists = (params) => api.get('/clinic/receptionists', { params });
export const addClinicReceptionist = (data) => api.post('/clinic/receptionists', data);
export const updateClinicReceptionist = (id, data) => api.put(`/clinic/receptionists/${id}`, data);
export const deleteClinicReceptionist = (id) => api.delete(`/clinic/receptionists/${id}`);

// ========== Receptionist APIs ==========
export const receptionistWalkIn = (data) => api.post('/receptionist/walk-in', data);
export const receptionistCollectPayment = (appointmentId, data) => api.put(`/receptionist/collect-payment/${appointmentId}`, data);
export const getReceptionistTodaySummary = () => api.get('/receptionist/today-summary');

// ========== Queue APIs ==========
export const getTodayQueue = () => api.get('/queue/today');
export const queueCheckIn = (data) => api.post('/queue/check-in', data);
export const updateQueueStatus = (appointmentId, data) => api.put(`/queue/patient/${appointmentId}/status`, data);
export const callNextPatient = () => api.put('/queue/next');

// ========== Schedule Exception APIs ==========
export const createScheduleException = (data) => api.post('/slots/exceptions', data);
export const getMyExceptions = (params) => api.get('/slots/exceptions', { params });
export const getDoctorExceptions = (doctorId) => api.get(`/slots/exceptions/${doctorId}`);
export const deleteScheduleException = (id) => api.delete(`/slots/exceptions/${id}`);

// ========== Reschedule & Audit APIs ==========
export const rescheduleAppointment = (id, data) => api.put(`/appointments/${id}/reschedule`, data);
export const getAppointmentAudit = (id) => api.get(`/appointments/${id}/audit`);

// ========== Inventory APIs ==========
// Items
export const getInventoryItems = (params) => api.get('/inventory/items', { params });
export const getInventoryItem = (id) => api.get(`/inventory/items/${id}`);
export const createInventoryItem = (data) => api.post('/inventory/items', data);
export const updateInventoryItem = (id, data) => api.put(`/inventory/items/${id}`, data);
export const deleteInventoryItem = (id) => api.delete(`/inventory/items/${id}`);

// Stock Movements
export const recordStockMovement = (data) => api.post('/inventory/stock', data);
export const getStockMovements = (itemId, params) => api.get(`/inventory/stock/${itemId}`, { params });
export const consumeInventoryItems = (data) => api.post('/inventory/consume', data);

// Vendors
export const getVendors = (params) => api.get('/inventory/vendors', { params });
export const createVendor = (data) => api.post('/inventory/vendors', data);
export const updateVendor = (id, data) => api.put(`/inventory/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/inventory/vendors/${id}`);

// Alerts & Reports
export const getInventoryAlerts = () => api.get('/inventory/alerts');
export const getStockLedger = (params) => api.get('/inventory/reports/ledger', { params });

export default api;
