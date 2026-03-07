import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sendOTP, verifyOTP, updateProfile } from '../../services/api';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState('phone'); // 'phone', 'otp', or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Registration fields for new users
  const [regName, setRegName] = useState('');
  const [regGender, setRegGender] = useState('');

  // Get redirect URL from location state (e.g. from BookingWizard)
  const redirectTo = location.state?.redirectTo || null;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return setError('Enter a valid 10-digit phone number');
    setError('');
    setLoading(true);
    try {
      const res = await sendOTP(phone);
      if (res.data.otp) setDevOtp(res.data.otp.toString());
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Navigate to the correct page based on role or redirectTo
  const doRedirect = (role) => {
    if (redirectTo) {
      navigate(redirectTo);
      return;
    }
    // Role-based redirect
    if (role === 'admin') navigate('/admin');
    else if (role === 'clinic_admin') navigate('/clinic');
    else if (role === 'doctor') navigate('/doctor');
    else if (role === 'receptionist') navigate('/receptionist');
    else navigate('/dashboard');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) return setError('Enter the 6-digit OTP');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOTP(phone, otpString);
      login(res.data.token, res.data.user);

      if (res.data.isNewUser) {
        // New user — show registration step to collect Name & Gender
        setStep('register');
      } else {
        // Existing user — redirect immediately
        doRedirect(res.data.user?.role);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) return setError('Please enter your name');
    if (!regGender) return setError('Please select your gender');
    setError('');
    setLoading(true);
    try {
      const res = await updateProfile({ name: regName.trim(), gender: regGender });
      // Update auth context with fresh user data
      const updatedUser = res.data.user;
      login(localStorage.getItem('clinic_token'), updatedUser);
      doRedirect(updatedUser?.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f2fd 50%, #f6f7f8 100%)' }}>
      <div style={{ width: '100%', maxWidth: '420px', margin: '2rem 1rem' }}>
        <div className="card p-4 p-md-5" style={{ border: 'none', boxShadow: 'var(--shadow-lg)' }}>
          <div className="text-center mb-4">
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>
                {step === 'register' ? 'person_add' : 'login'}
              </span>
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: '0.375rem' }}>
              {step === 'phone' ? 'Welcome' : step === 'otp' ? 'Verify OTP' : 'Complete Profile'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {step === 'phone'
                ? 'Enter your phone number to login or register'
                : step === 'otp'
                ? `We sent a 6-digit code to +91 ${phone}`
                : 'Please provide your details to continue'}
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3" style={{ fontSize: '0.8125rem', borderRadius: 'var(--radius)' }}>
              {error}
            </div>
          )}

          {/* ===== Step 1: Phone Number ===== */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Phone Number</label>
              <div className="d-flex gap-2 mb-4">
                <div className="form-control d-flex align-items-center" style={{ width: '72px', justifyContent: 'center', fontWeight: 600, background: 'var(--bg-light)' }}>
                  +91
                </div>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoFocus
                  style={{ fontWeight: 500, fontSize: '1rem' }}
                />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <span className="material-symbols-outlined me-2" style={{ fontSize: '18px' }}>send</span>
                )}
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ===== Step 2: OTP Verification ===== */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', display: 'block' }}>Enter OTP</label>
              <div className="d-flex gap-2 justify-content-center mb-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="form-control text-center"
                    style={{ width: '48px', height: '52px', fontSize: '1.25rem', fontWeight: 700, padding: 0 }}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {devOtp && (
                <div className="text-center mb-3" style={{ background: '#fef3c7', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem' }}>
                  🧪 Dev OTP: <strong>{devOtp}</strong>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-100 py-2 mb-3" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <span className="material-symbols-outlined me-2" style={{ fontSize: '18px' }}>verified</span>
                )}
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem' }}
                  onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                >
                  ← Change Number
                </button>
              </div>
            </form>
          )}

          {/* ===== Step 3: Registration (New Users Only) ===== */}
          {step === 'register' && (
            <form onSubmit={handleRegister}>
              {/* Name */}
              <div className="mb-3">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  autoFocus
                  style={{ fontWeight: 500, fontSize: '1rem' }}
                />
              </div>

              {/* Gender */}
              <div className="mb-4">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
                  Gender <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="d-flex gap-2">
                  {[
                    { value: 'male', label: '👨 Male', color: '#3b82f6' },
                    { value: 'female', label: '👩 Female', color: '#ec4899' },
                    { value: 'other', label: '🧑 Other', color: '#8b5cf6' },
                  ].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      className="btn flex-fill"
                      onClick={() => setRegGender(g.value)}
                      style={{
                        border: regGender === g.value ? `2px solid ${g.color}` : '1.5px solid var(--border)',
                        background: regGender === g.value ? `${g.color}10` : 'var(--bg-white)',
                        color: regGender === g.value ? g.color : 'var(--text-muted)',
                        fontWeight: regGender === g.value ? 700 : 500,
                        borderRadius: '10px',
                        padding: '0.625rem 0.5rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone display (read-only) */}
              <div className="mb-4" style={{ background: '#f0fdf4', padding: '0.625rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#16a34a' }}>check_circle</span>
                <span style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 600 }}>+91 {phone} verified</span>
              </div>

              <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}
                style={{ background: 'linear-gradient(135deg, #137fec 0%, #0960b6 100%)', borderRadius: '10px', fontWeight: 700 }}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <span className="material-symbols-outlined me-2" style={{ fontSize: '18px' }}>how_to_reg</span>
                )}
                {loading ? 'Saving...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
