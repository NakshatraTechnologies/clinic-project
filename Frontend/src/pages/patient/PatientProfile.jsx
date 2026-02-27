import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/api';

const PatientProfile = () => {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    address: user?.address || '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await updateProfile(form);
      await checkAuth();
      setMsg('Profile updated successfully!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>My Profile</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage your personal information.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card p-4" style={{ border: '1px solid var(--border)' }}>
            {msg && (
              <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-danger'} py-2`} style={{ fontSize: '0.875rem' }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Full Name</label>
                  <input type="text" className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Phone Number</label>
                  <input type="text" className="form-control" value={user?.phone || ''} disabled style={{ background: '#f9fafb' }} />
                  <small style={{ color: 'var(--text-light)', fontSize: '0.75rem' }}>Phone cannot be changed</small>
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Gender</label>
                  <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Date of Birth</label>
                  <input type="date" className="form-control" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
                <div className="col-12">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Address</label>
                  <textarea className="form-control" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
              </div>
              <div className="mt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card p-4 text-center" style={{ border: '1px solid var(--border)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '2rem', margin: '0 auto 1rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <h5 style={{ fontWeight: 700 }}>{user?.name || 'User'}</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>📞 {user?.phone}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
