import { useState } from 'react';
import { Link } from 'react-router-dom';
import { receptionistWalkIn } from '../../services/api';

const WalkInEntry = () => {
  const [form, setForm] = useState({ name: '', phone: '', gender: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await receptionistWalkIn(form);
      setResult(res.data);
      setForm({ name: '', phone: '', gender: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register walk-in');
    } finally {
      setLoading(false);
    }
  };

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
              <button type="submit" className="btn btn-primary w-100" disabled={loading}>
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
