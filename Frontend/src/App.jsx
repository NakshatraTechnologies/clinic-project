import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import DoctorSearch from './pages/public/DoctorSearch';
import DoctorProfile from './pages/public/DoctorProfile';
import Dashboard from './pages/patient/Dashboard';
import DashboardHome from './pages/patient/DashboardHome';
import MyAppointments from './pages/patient/MyAppointments';
import MedicalRecords from './pages/patient/MedicalRecords';
import PatientProfile from './pages/patient/PatientProfile';
import BookingConfirmation from './pages/patient/BookingConfirmation';

// Doctor Dashboard
import DoctorDashboardLayout from './pages/doctor/DoctorDashboardLayout';
import DocDashboardHome from './pages/doctor/DocDashboardHome';
import DocAppointments from './pages/doctor/DocAppointments';
import DocPatients from './pages/doctor/DocPatients';
import DocPrescriptions from './pages/doctor/DocPrescriptions';
import DocProfile from './pages/doctor/DocProfile';
import DocExceptions from './pages/doctor/DocExceptions';

// Super Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClinics from './pages/admin/AdminClinics';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSupport from './pages/admin/AdminSupport';

// Clinic Admin
import ClinicLayout from './pages/clinic/ClinicLayout';
import ClinicDashboard from './pages/clinic/ClinicDashboard';
import ClinicDoctors from './pages/clinic/ClinicDoctors';
import ClinicReceptionists from './pages/clinic/ClinicReceptionists';
import ClinicSettings from './pages/clinic/ClinicSettings';
import InventoryList from './pages/clinic/InventoryList';
import InventoryItemForm from './pages/clinic/InventoryItemForm';
import StockMovementPage from './pages/clinic/StockMovement';
import VendorList from './pages/clinic/VendorList';
import InventoryAlerts from './pages/clinic/InventoryAlerts';
import InventoryReports from './pages/clinic/InventoryReports';

// Receptionist
import ReceptionistLayout from './pages/receptionist/ReceptionistLayout';
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import WalkInEntry from './pages/receptionist/WalkInEntry';
import LiveQueue from './pages/receptionist/LiveQueue';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <div className="flex-grow-1">
            <Routes>
              <Route path="/" element={<><Home /><Footer /></>} />
              <Route path="/login" element={<Login />} />
              <Route path="/doctors" element={<><DoctorSearch /><Footer /></>} />
              <Route path="/doctors/:id" element={<><DoctorProfile /><Footer /></>} />
              <Route path="/booking-confirmation/:id" element={<><BookingConfirmation /><Footer /></>} />

              {/* Patient Dashboard */}
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardHome />} />
                <Route path="appointments" element={<MyAppointments />} />
                <Route path="records" element={<MedicalRecords />} />
                <Route path="profile" element={<PatientProfile />} />
              </Route>

              {/* Doctor Dashboard */}
              <Route path="/doctor" element={<DoctorDashboardLayout />}>
                <Route index element={<DocDashboardHome />} />
                <Route path="appointments" element={<DocAppointments />} />
                <Route path="patients" element={<DocPatients />} />
                <Route path="prescriptions" element={<DocPrescriptions />} />
                <Route path="exceptions" element={<DocExceptions />} />
                <Route path="profile" element={<DocProfile />} />
              </Route>

              {/* Super Admin */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="clinics" element={<AdminClinics />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="support" element={<AdminSupport />} />
              </Route>

              {/* Clinic Admin */}
              <Route path="/clinic" element={<ClinicLayout />}>
                <Route index element={<ClinicDashboard />} />
                <Route path="doctors" element={<ClinicDoctors />} />
                <Route path="receptionists" element={<ClinicReceptionists />} />
                <Route path="inventory" element={<InventoryList />} />
                <Route path="inventory/add" element={<InventoryItemForm />} />
                <Route path="inventory/:id/edit" element={<InventoryItemForm />} />
                <Route path="inventory/stock" element={<StockMovementPage />} />
                <Route path="inventory/vendors" element={<VendorList />} />
                <Route path="inventory/alerts" element={<InventoryAlerts />} />
                <Route path="inventory/reports" element={<InventoryReports />} />
                <Route path="settings" element={<ClinicSettings />} />
              </Route>

              {/* Receptionist */}
              <Route path="/receptionist" element={<ReceptionistLayout />}>
                <Route index element={<ReceptionistDashboard />} />
                <Route path="walk-in" element={<WalkInEntry />} />
                <Route path="queue" element={<LiveQueue />} />
              </Route>
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

