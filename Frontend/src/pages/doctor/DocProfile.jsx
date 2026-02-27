import { useState, useEffect } from 'react';
import { getDoctorProfile, updateDoctorProfile, updateAvailability } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DocProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [msg, setMsg] = useState('');

  // Editable fields
  const [formData, setFormData] = useState({
    specialization: '',
    qualifications: '',
    experience: 0,
    consultationFee: 0,
    slotDuration: 15,
    bio: '',
    clinicName: '',
    licenseNumber: '',
  });

  const [availability, setAvailability] = useState([]);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getDoctorProfile();
        setProfile(res.data.user);
        setDoctorProfile(res.data.doctorProfile);

        const dp = res.data.doctorProfile;
        if (dp) {
          setFormData({
            specialization: dp.specialization?.join(', ') || '',
            qualifications: dp.qualifications?.join(', ') || '',
            experience: dp.experience || 0,
            consultationFee: dp.consultationFee || 0,
            slotDuration: dp.slotDuration || 15,
            bio: dp.bio || '',
            clinicName: dp.clinicName || '',
            licenseNumber: dp.licenseNumber || '',
          });

          // Initialize availability
          const avail = days.map((day) => {
            const existing = dp.availability?.find((a) => a.day === day);
            return existing || { day, isAvailable: false, slots: [] };
          });
          setAvailability(avail);
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateDoctorProfile({
        specialization: formData.specialization.split(',').map((s) => s.trim()).filter(Boolean),
        qualifications: formData.qualifications.split(',').map((s) => s.trim()).filter(Boolean),
        experience: Number(formData.experience),
        consultationFee: Number(formData.consultationFee),
        slotDuration: Number(formData.slotDuration),
        bio: formData.bio,
        clinicName: formData.clinicName,
        licenseNumber: formData.licenseNumber,
      });
      setMsg('Profile updated successfully! ✅');
    } catch (err) {
      setMsg('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilitySave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateAvailability({
        availability,
        slotDuration: Number(formData.slotDuration),
      });
      setMsg('Schedule updated successfully! ✅');
    } catch (err) {
      setMsg('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayIndex) => {
    setAvailability((prev) => prev.map((a, i) =>
      i === dayIndex ? { ...a, isAvailable: !a.isAvailable } : a
    ));
  };

  const addSlot = (dayIndex) => {
    setAvailability((prev) => prev.map((a, i) =>
      i === dayIndex ? { ...a, slots: [...a.slots, { startTime: '09:00', endTime: '13:00' }] } : a
    ));
  };

  const removeSlot = (dayIndex, slotIndex) => {
    setAvailability((prev) => prev.map((a, i) =>
      i === dayIndex ? { ...a, slots: a.slots.filter((_, si) => si !== slotIndex) } : a
    ));
  };

  const updateSlotTime = (dayIndex, slotIndex, field, value) => {
    setAvailability((prev) => prev.map((a, i) =>
      i === dayIndex ? {
        ...a,
        slots: a.slots.map((s, si) => si === slotIndex ? { ...s, [field]: value } : s)
      } : a
    ));
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>
        <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>settings</span>
        Profile & Schedule
      </h4>

      {msg && (
        <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-danger'} py-2`} style={{ fontSize: '0.85rem' }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {['profile', 'schedule'].map((tab) => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab(tab)}
            style={{ borderRadius: '20px', textTransform: 'capitalize' }}
          >
            <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>
              {tab === 'profile' ? 'person' : 'schedule'}
            </span>
            {tab === 'profile' ? 'Profile Details' : 'Schedule & Availability'}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-4" style={{ border: '1px solid var(--border)' }}>
          {/* Doctor Info Header */}
          <div className="d-flex align-items-center gap-3 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h5 style={{ fontWeight: 700, margin: 0 }}>{user?.name}</h5>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>📱 {user?.phone} • 📧 {user?.email || 'N/A'}</div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Specializations (comma-separated)</label>
              <input type="text" className="form-control" value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Qualifications (comma-separated)</label>
              <input type="text" className="form-control" value={formData.qualifications} onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Experience (years)</label>
              <input type="number" className="form-control" value={formData.experience} onChange={(e) => setFormData({ ...formData, experience: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Consultation Fee (₹)</label>
              <input type="number" className="form-control" value={formData.consultationFee} onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Slot Duration (min)</label>
              <select className="form-select" value={formData.slotDuration} onChange={(e) => setFormData({ ...formData, slotDuration: e.target.value })}>
                {[10, 15, 20, 30, 45, 60].map((d) => <option key={d} value={d}>{d} minutes</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Clinic Name</label>
              <input type="text" className="form-control" value={formData.clinicName} onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>License Number</label>
              <input type="text" className="form-control" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Bio</label>
              <textarea className="form-control" rows="3" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })}></textarea>
            </div>
          </div>

          <button className="btn btn-primary mt-4" onClick={handleProfileSave} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Save Profile
          </button>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="card p-4" style={{ border: '1px solid var(--border)' }}>
          <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>
            <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)', fontSize: '20px' }}>calendar_month</span>
            Weekly Availability
          </h6>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Set your available days and time slots. Patients can only book during these times.
          </p>

          {availability.map((day, dayIndex) => (
            <div key={day.day} className="mb-3 p-3" style={{ background: day.isAvailable ? '#f0fdf4' : 'var(--bg-light)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-3">
                  <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={day.isAvailable} onChange={() => toggleDay(dayIndex)} style={{ cursor: 'pointer' }} />
                  </div>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize', fontSize: '0.9rem' }}>{day.day}</span>
                </div>
                {day.isAvailable && (
                  <button className="btn btn-sm btn-outline-primary" onClick={() => addSlot(dayIndex)} style={{ fontSize: '0.75rem', borderRadius: '16px' }}>
                    + Add Slot
                  </button>
                )}
              </div>

              {day.isAvailable && day.slots?.map((slot, slotIndex) => (
                <div key={slotIndex} className="d-flex align-items-center gap-2 mb-2 ms-5" style={{ fontSize: '0.85rem' }}>
                  <input type="time" className="form-control form-control-sm" value={slot.startTime} onChange={(e) => updateSlotTime(dayIndex, slotIndex, 'startTime', e.target.value)} style={{ maxWidth: '130px' }} />
                  <span style={{ color: 'var(--text-muted)' }}>to</span>
                  <input type="time" className="form-control form-control-sm" value={slot.endTime} onChange={(e) => updateSlotTime(dayIndex, slotIndex, 'endTime', e.target.value)} style={{ maxWidth: '130px' }} />
                  <button className="btn btn-sm btn-outline-danger" onClick={() => removeSlot(dayIndex, slotIndex)} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>✕</button>
                </div>
              ))}

              {day.isAvailable && day.slots?.length === 0 && (
                <div className="ms-5" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  No time slots defined. Click "+ Add Slot" to add one.
                </div>
              )}
            </div>
          ))}

          <button className="btn btn-primary mt-3" onClick={handleAvailabilitySave} disabled={saving}>
            {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
            Save Schedule
          </button>
        </div>
      )}
    </div>
  );
};

export default DocProfile;

