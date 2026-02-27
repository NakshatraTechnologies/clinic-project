import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyPrescriptions } from '../../services/api';

const MedicalRecords = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPrescriptions();
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      const res = await getMyPrescriptions(user._id);
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>Medical Records</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>View your prescriptions and medical history.</p>
      </div>

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>description</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No medical records yet</h5>
          <p style={{ color: 'var(--text-muted)' }}>Your prescriptions will appear here after doctor visits.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="card p-4" style={{ border: '1px solid var(--border)' }}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div className="d-flex gap-3">
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>medication</span>
                  </div>
                  <div>
                    <h6 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                      Prescription — {rx.diagnosis || 'General Consultation'}
                    </h6>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Dr. {rx.doctorId?.name || 'Unknown'} • {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {rx.medicines?.length > 0 && (
                      <div className="mt-2">
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Medicines: </span>
                        {rx.medicines.map((m, i) => (
                          <span key={i} className="badge me-1" style={{ background: '#f0f2f4', color: 'var(--text-dark)', fontWeight: 500 }}>
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {rx.followUpDate && (
                      <div className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 600 }}>
                        📅 Follow-up: {new Date(rx.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {rx.pdfUrl && (
                    <a
                      href={`${(import.meta.env.VITE_API_BASE || 'http://localhost:5000/api').replace('/api', '')}${rx.pdfUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecords;
