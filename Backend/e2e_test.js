const API_URL = 'http://localhost:5000/api';

const state = {
  superAdmin: { phone: '9999999999', token: '', id: '' },
  clinicAdmin: { phone: '9999999998', token: '', id: '' },
  doctor: { phone: '9876543210', token: '', id: '' },
  receptionist: { phone: '9876543211', token: '', id: '' },
  patient: { phone: '9876543212', token: '', id: '' },
  clinicId: '',
  doctorId: '',
};

let passed = 0;
let failed = 0;
let report = [];

function logResult(step, status, expected, actual, error = null) {
  if (status) passed++; else failed++;
  report.push({ step, status, expected, actual, error });
  console.log(`${status ? '✅' : '❌'} ${step}`);
  if (error) console.log(`   -> Error: ${error}\n`);
}

async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  
  if (!res.ok) throw new Error(data.message || 'API request failed');
  return data;
}

async function login(phone) {
  const sendRes = await apiCall('/auth/send-otp', 'POST', { phone });
  const otp = sendRes.otp;
  const verifyRes = await apiCall('/auth/verify-otp', 'POST', { phone, otp });
  return { token: verifyRes.token, user: verifyRes.user };
}

async function runTests() {
  console.log("==========================================");
  console.log("🚀 STARTING AUTOMATED API E2E TESTS ");
  console.log("==========================================\n");

  try {
    const authData = await login(state.superAdmin.phone);
    state.superAdmin.token = authData.token;
    state.superAdmin.id = authData.user._id;
    logResult("SuperAdmin Login", true, "Receive Token", "Success");
  } catch (err) {
    logResult("SuperAdmin Login", false, "Receive Token", "Failed", err.message);
    return;
  }

  const rand = Math.floor(Math.random() * 1000);
  state.clinicAdmin.phone = `999999${rand.toString().padStart(4, '0')}`;
  state.doctor.phone = `987654${rand.toString().padStart(4, '0')}`;
  state.receptionist.phone = `987655${rand.toString().padStart(4, '0')}`;
  state.patient.phone = `987656${rand.toString().padStart(4, '0')}`;

  try {
    const payload = {
      clinicName: `E2E Clinic ${rand}`,
      clinicPhone: "1111111111",
      adminName: "E2E Clinic Admin",
      adminPhone: state.clinicAdmin.phone,
      adminEmail: `admin${rand}@e2eclinic.com`
    };
    const res = await apiCall('/admin/clinics', 'POST', payload, state.superAdmin.token);
    state.clinicId = res.clinic._id;
    state.clinicAdmin.id = res.clinicAdmin._id;
    logResult("SuperAdmin Creates Clinic & Admin", true, "Clinic and Admin returned", "Success");
  } catch (err) {
    logResult("SuperAdmin Creates Clinic & Admin", false, "Clinic and Admin returned", "Failed", err.message);
  }

  try {
    const authData = await login(state.clinicAdmin.phone);
    state.clinicAdmin.token = authData.token;
    logResult("ClinicAdmin Login", true, "Receive Token", "Success");
  } catch (err) {
    logResult("ClinicAdmin Login", false, "Receive Token", "Failed", err.message);
  }

  try {
    const payload = {
      name: "Dr. E2E",
      phone: state.doctor.phone,
      specialization: ["Cardiology"],
      consultationFee: 1000,
      slotDuration: 15
    };
    const res = await apiCall('/clinic/doctors', 'POST', payload, state.clinicAdmin.token);
    state.doctorId = res.doctor._id;
    logResult("ClinicAdmin Creates Doctor", true, "Doctor Profile returned", "Success");
  } catch (err) {
    logResult("ClinicAdmin Creates Doctor", false, "Doctor Profile returned", "Failed", err.message);
  }

  try {
    const payload = {
      name: "E2E Receptionist",
      phone: state.receptionist.phone
    };
    await apiCall('/clinic/receptionists', 'POST', payload, state.clinicAdmin.token);
    logResult("ClinicAdmin Creates Receptionist", true, "Receptionist returned", "Success");
  } catch (err) {
    logResult("ClinicAdmin Creates Receptionist", false, "Receptionist returned", "Failed", err.message);
  }

  try {
    const authData = await login(state.patient.phone);
    state.patient.token = authData.token;
    state.patient.id = authData.user._id;
    logResult("Patient Registration/Login", true, "Account linked", "Success");
  } catch (err) {
    logResult("Patient Registration/Login", false, "Account linked", "Failed", err.message);
  }

  try {
    const payload = {
      name: "E2E Patient",
      bloodGroup: "O+",
    };
    await apiCall('/auth/update-profile', 'PUT', payload, state.patient.token);
    logResult("Patient Profile Update", true, "Profile updated with Name & Blood Group", "Success");
  } catch (err) {
    logResult("Patient Profile Update", false, "Profile updated", "Failed", err.message);
  }

  try {
    const res = await apiCall('/public/doctors');
    logResult("Patient Searches Public Doctors", true, "Array of approved doctors", `Count: ${res.count}`);
  } catch (err) {
    logResult("Patient Searches Public Doctors", false, "Array of approved doctors", "Failed", err.message);
  }

  try {
    const authData = await login(state.doctor.phone);
    state.doctor.token = authData.token;
    logResult("Doctor Login", true, "Doctor token received", "Success");
  } catch (err) {
    logResult("Doctor Login", false, "Doctor token received", "Failed", err.message);
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await apiCall(`/slots/${state.doctorId}/${today}`, 'GET', null, state.doctor.token);
    logResult("Doctor Fetches Appointments/Slots for Today", true, "Slots returned", "Success");
  } catch (err) {
    logResult("Doctor Fetches Appointments/Slots", false, "Slots returned", "Failed", err.message);
  }

  const fs = require('fs');
  const reportPath = 'e2e_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n==========================================");
  console.log(`📊 TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
  console.log("==========================================\n");
  console.log(`Detailed JSON report saved to ${reportPath}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
