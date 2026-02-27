import { useState, useEffect } from 'react';
import { getDoctorPatients, getPatientRecords } from '../../services/api';

const DocPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await getDoctorPatients({ search, page, limit: 15 });
      setPatients(res.data.patients || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Fetch patients error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [search, page]);

  const viewRecords = async (patient) => {
    setSelectedPatient(patient);
    setRecordsLoading(true);
    try {
      const res = await getPatientRecords(null, patient._id);
      setPatientRecords(res.data);
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h4 style={{ fontWeight: 800, margin: 0 }}>
          <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>group</span>
          My Patients
        </h4>
        <div style={{ maxWidth: '300px', width: '100%' }}>
          <div className="position-relative">
            <span className="material-symbols-outlined position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search patient name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '80px', overflowY: 'auto' }} onClick={() => { setSelectedPatient(null); setPatientRecords(null); }}>
          <div className="card p-4" style={{ maxWidth: '700px', width: '95%', border: 'none', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>person</span>
                {selectedPatient.name}
              </h5>
              <button className="btn btn-sm" onClick={() => { setSelectedPatient(null); setPatientRecords(null); }} style={{ background: 'var(--bg-light)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Patient Info */}
            <div className="row g-2 mb-3" style={{ fontSize: '0.85rem' }}>
              <div className="col-6"><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{selectedPatient.phone}</strong></div>
              <div className="col-6"><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{selectedPatient.gender || '-'}</strong></div>
              <div className="col-6"><span style={{ color: 'var(--text-muted)' }}>DOB:</span> <strong>{formatDate(selectedPatient.dateOfBirth)}</strong></div>
              <div className="col-6"><span style={{ color: 'var(--text-muted)' }}>Blood:</span> <strong>{selectedPatient.bloodGroup || '-'}</strong></div>
            </div>

            {recordsLoading ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : patientRecords ? (
              <>
                {/* Visit History */}
                <h6 style={{ fontWeight: 700, marginTop: '1rem' }}>Visit History ({patientRecords.appointments?.length || 0})</h6>
                {patientRecords.appointments?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No visits yet.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {patientRecords.appointments?.map((apt) => (
                      <div key={apt._id} className="d-flex align-items-center gap-2 p-2 mb-1" style={{ background: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600 }}>{formatDate(apt.date)}</span>
                        <span className="badge" style={{ background: apt.status === 'completed' ? '#dcfce7' : '#fef3c7', color: apt.status === 'completed' ? '#166534' : '#92400e' }}>{apt.status}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{apt.startTime} - {apt.endTime}</span>
                        <span style={{ color: '#16a34a', fontWeight: 600, marginLeft: 'auto' }}>₹{apt.amount}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Prescriptions */}
                <h6 style={{ fontWeight: 700, marginTop: '1rem' }}>Prescriptions ({patientRecords.prescriptions?.length || 0})</h6>
                {patientRecords.prescriptions?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No prescriptions yet.</p>
                ) : (
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {patientRecords.prescriptions?.map((rx) => (
                      <div key={rx._id} className="p-2 mb-1" style={{ background: '#ede9fe', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div className="d-flex align-items-center justify-content-between">
                          <span style={{ fontWeight: 600 }}>{formatDate(rx.createdAt)}</span>
                          <span style={{ color: '#7c3aed', fontWeight: 600 }}>{rx.diagnosis || 'No diagnosis'}</span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {rx.medicines?.length} medicine(s) | {rx.symptoms?.join(', ') || 'No symptoms listed'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Patient List */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '56px', opacity: 0.3 }}>person_off</span>
          <h5 style={{ fontWeight: 700 }}>No patients found</h5>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {patients.map((patient) => (
              <div className="col-12 col-md-6 col-xl-4" key={patient._id}>
                <div className="card p-3 h-100" style={{ border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => viewRecords(patient)}>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #e8f2fd, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', flexShrink: 0 }}>
                      {patient.name?.charAt(0) || 'P'}
                    </div>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {patient.phone}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>{patient.totalVisits || 0} visits</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{patient.lastVisit ? `Last: ${formatDate(patient.lastVisit)}` : 'No visits'}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {patient.gender && <span>👤 {patient.gender}</span>}
                    {patient.bloodGroup && <span>🩸 {patient.bloodGroup}</span>}
                    {patient.dateOfBirth && <span>🎂 {formatDate(patient.dateOfBirth)}</span>}
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

export default DocPatients;

