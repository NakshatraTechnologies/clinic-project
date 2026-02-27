import { useState, useEffect } from 'react';
import { getDoctorPrescriptions } from '../../services/api';

const DocPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getDoctorPrescriptions({ page, limit: 15 });
        setPrescriptions(res.data.prescriptions || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 style={{ fontWeight: 800, margin: 0 }}>
          <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>clinical_notes</span>
          Prescriptions
        </h4>
        <span className="badge bg-primary" style={{ fontSize: '0.8rem' }}>{prescriptions.length} records</span>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '56px', opacity: 0.3 }}>note_add</span>
          <h5 style={{ fontWeight: 700 }}>No prescriptions yet</h5>
          <p style={{ fontSize: '0.875rem' }}>Create prescriptions from the appointments page.</p>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {prescriptions.map((rx) => (
              <div className="col-12 col-md-6" key={rx._id}>
                <div className="card p-3 h-100" style={{ border: '1px solid var(--border)' }}>
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rx.patientId?.name || 'Patient'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {rx.patientId?.phone || '-'}</div>
                    </div>
                    <div className="text-end">
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(rx.createdAt)}</div>
                      {rx.appointmentId?.date && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Apt: {formatDate(rx.appointmentId.date)}</div>
                      )}
                    </div>
                  </div>

                  {rx.diagnosis && (
                    <div className="mb-2 px-2 py-1" style={{ background: '#ede9fe', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: '#7c3aed' }}>Diagnosis:</span> {rx.diagnosis}
                    </div>
                  )}

                  {rx.symptoms?.length > 0 && (
                    <div className="mb-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <strong>Symptoms:</strong> {rx.symptoms.join(', ')}
                    </div>
                  )}

                  <div className="mb-2" style={{ fontSize: '0.8rem' }}>
                    <strong>Medicines ({rx.medicines?.length || 0}):</strong>
                    <div style={{ maxHeight: '80px', overflowY: 'auto', marginTop: '4px' }}>
                      {rx.medicines?.map((med, i) => (
                        <div key={i} className="d-flex justify-content-between" style={{ fontSize: '0.75rem', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>{med.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{med.dosage} • {med.frequency} • {med.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {rx.followUpDate && (
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span>
                      Follow-up: {formatDate(rx.followUpDate)}
                    </div>
                  )}

                  <div className="d-flex gap-2 mt-2">
                    {rx.pdfUrl && (
                      <a href={`${API_BASE.replace('/api', '')}${rx.pdfUrl}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span> PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 gap-2">
              <button className="btn btn-sm btn-outline-primary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="d-flex align-items-center px-3" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-primary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocPrescriptions;

