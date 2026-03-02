import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { receptionistWalkIn, getClinicDoctors } from '../../services/api';

const WalkInEntry = () => {
  const [form, setForm] = useState({ name: '', phone: '', gender: '', notes: '', doctorId: '' });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await getClinicDoctors({ page: 1, limit: 50 });
        const docs = res.data.doctors || [];
        setDoctors(docs);
        // Auto-select first doctor if only one
        if (docs.length === 1) {
          setForm(f => ({ ...f, doctorId: docs[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.doctorId && doctors.length > 1) {
      setError('Please select a doctor');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await receptionistWalkIn(form);
      setResult(res.data);
      setForm({ name: '', phone: '', gender: '', notes: '', doctorId: doctors.length === 1 ? form.doctorId : '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register walk-in');
    } finally {
      setLoading(false);
    }
  };

  const selectedDoctor = doctors.find(d => (d.userId?._id || d.userId) === form.doctorId);

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#7c3aed', fontSize: '28px', verticalAlign: 'middle' }}>person_add</span>
          Walk-In Registration
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Register a walk-in patient and auto-assign a queue token.</p>
      </div>

      {/* Success Card */}
      {result && (
        <div className="card mb-4" style={{ border: '2px solid #059669', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '2rem', textAlign: 'center', color: '#fff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '0.5rem' }}>check_circle</span>
            <h4 style={{ fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Walk-In Registered!</h4>
            <p style={{ opacity: 0.9, margin: 0, fontSize: '0.875rem' }}>{result.message}</p>
          </div>
          <div className="p-4">
            <div className="row text-center" style={{ fontSize: '0.9375rem' }}>
              <div className="col-4">
                <div style={{ fontWeight: 800, fontSize: '2.5rem', color: '#059669', lineHeight: 1 }}>{result.tokenNumber}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>TOKEN NO.</div>
              </div>
              <div className="col-4">
                <div style={{ fontWeight: 700 }}>{result.patient?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Patient</div>
              </div>
              <div className="col-4">
                <div style={{ fontWeight: 700 }}>{result.patient?.phone}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Phone</div>
              </div>
            </div>
            <div className="d-flex gap-2 justify-content-center mt-3">
              <button className="btn btn-primary btn-sm" onClick={() => setResult(null)}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>person_add</span>
                Register Another
              </button>
              <Link to="/receptionist/queue" className="btn btn-outline-primary btn-sm">
                <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>queue</span>
                View Queue
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form */}
      {!result && (
        <div className="card" style={{ border: '1px solid var(--border)', maxWidth: '550px' }}>
          <div className="p-4">
            {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.875rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Doctor Selection */}
              <div className="mb-3">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>
                  Select Doctor *
                </label>
                {doctorsLoading ? (
                  <div className="d-flex align-items-center gap-2 py-2">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading doctors...</span>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="alert alert-warning py-2 mb-0" style={{ fontSize: '0.875rem' }}>
                    No doctors found in this clinic.
                  </div>
                ) : doctors.length === 1 ? (
                  <div className="d-flex align-items-center gap-2 py-2 px-3" style={{ background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '20px' }}>person</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Dr. {doctors[0].name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doctors[0].doctorProfile?.specialization || 'General'} • ₹{doctors[0].doctorProfile?.consultationFee || 0}</div>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex flex-wrap gap-2">
                    {doctors.map((doc) => {
                      const docId = doc._id;
                      const isSelected = form.doctorId === docId;
                      return (
                        <button
                          key={docId}
                          type="button"
                          className="btn btn-sm d-flex align-items-center gap-2"
                          style={{
                            border: isSelected ? '2px solid #7c3aed' : '1px solid var(--border)',
                            background: isSelected ? '#ede9fe' : '#fff',
                            color: isSelected ? '#7c3aed' : 'var(--text)',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontWeight: isSelected ? 700 : 500,
                          }}
                          onClick={() => setForm({ ...form, doctorId: docId })}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {isSelected ? 'check_circle' : 'person'}
                          </span>
                          <div className="text-start">
                            <div style={{ fontSize: '0.85rem' }}>Dr. {doc.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{doc.doctorProfile?.specialization || 'General'} • ₹{doc.doctorProfile?.consultationFee || 0}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Patient Name *</label>
                <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Full name" autoFocus />
              </div>
              <div className="mb-3">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Phone Number *</label>
                <input type="tel" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} required maxLength={10} placeholder="10-digit number" />
              </div>
              <div className="mb-3">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Gender</label>
                <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="mb-4">
                <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Notes</label>
                <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Reason for visit, symptoms (optional)" />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={loading || (!form.doctorId && doctors.length > 0)}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Registering...</>
                ) : (
                  <><span className="material-symbols-outlined me-2" style={{ fontSize: '18px' }}>how_to_reg</span>Register & Get Token</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalkInEntry;
