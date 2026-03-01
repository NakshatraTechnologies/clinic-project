import { useState, useEffect } from 'react';
import { getDoctorPatients, getPatientRecords, createPrescription, finalizePrescription } from '../../services/api';

const DocPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success');

  // Prescription form state
  const [rxForm, setRxForm] = useState({
    appointmentId: '',
    diagnosis: '',
    symptoms: '',
    notes: '',
    followUpDate: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    labTests: '',
  });
  const [rxSaving, setRxSaving] = useState(false);

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
    setActiveTab('history');
    setMsg('');
    try {
      const res = await getPatientRecords(null, patient._id);
      setPatientRecords(res.data);
      // Pre-fill appointment dropdown with latest non-cancelled appointment
      const latestApt = res.data.appointments?.find(a => !['cancelled', 'no_show'].includes(a.status));
      if (latestApt) {
        setRxForm(prev => ({ ...prev, appointmentId: latestApt._id }));
      }
    } catch (err) {
      console.error('Fetch records error:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  // Medicine row handlers
  const addMedicine = () => setRxForm(prev => ({
    ...prev,
    medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
  }));

  const removeMedicine = (i) => setRxForm(prev => ({
    ...prev,
    medicines: prev.medicines.filter((_, idx) => idx !== i),
  }));

  const updateMedicine = (i, field, value) => setRxForm(prev => {
    const meds = [...prev.medicines];
    meds[i] = { ...meds[i], [field]: value };
    return { ...prev, medicines: meds };
  });

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(''), 4000);
  };

  const handleSaveDraft = async () => {
    if (!rxForm.appointmentId) return showMsg('Please select an appointment', 'danger');
    if (!rxForm.medicines[0]?.name) return showMsg('At least one medicine is required', 'danger');

    setRxSaving(true);
    try {
      await createPrescription({
        appointmentId: rxForm.appointmentId,
        patientId: selectedPatient._id,
        diagnosis: rxForm.diagnosis,
        symptoms: rxForm.symptoms ? rxForm.symptoms.split(',').map(s => s.trim()) : [],
        medicines: rxForm.medicines.filter(m => m.name),
        labTests: rxForm.labTests ? rxForm.labTests.split(',').map(s => s.trim()) : [],
        notes: rxForm.notes,
        followUpDate: rxForm.followUpDate || null,
      });
      showMsg('Draft saved successfully!');
      viewRecords(selectedPatient);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to save draft', 'danger');
    } finally {
      setRxSaving(false);
    }
  };

  const handleFinalize = async (prescriptionId) => {
    if (!window.confirm('Are you sure? Finalized prescriptions cannot be edited.')) return;
    try {
      await finalizePrescription(prescriptionId);
      showMsg('Prescription finalized!');
      viewRecords(selectedPatient);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to finalize', 'danger');
    }
  };

  const statusBadge = (s) => {
    const map = {
      booked: { bg: '#dbeafe', color: '#2563eb' }, checked_in: { bg: '#fef3c7', color: '#92400e' },
      in_consultation: { bg: '#ede9fe', color: '#7c3aed' }, prescription_created: { bg: '#d1fae5', color: '#059669' },
      completed: { bg: '#d1fae5', color: '#166534' }, cancelled: { bg: '#fee2e2', color: '#dc2626' },
      no_show: { bg: '#f3f4f6', color: '#6b7280' }, pending: { bg: '#f3f4f6', color: '#6b7280' },
      confirmed: { bg: '#dbeafe', color: '#2563eb' },
    };
    const style = map[s] || { bg: '#f3f4f6', color: '#6b7280' };
    return <span className="badge" style={{ background: style.bg, color: style.color, fontWeight: 600, fontSize: '0.7rem' }}>{s?.replace(/_/g, ' ')}</span>;
  };

  return (
    <div className="row g-0" style={{ minHeight: '75vh' }}>
      {/* LEFT PANEL: Patient List */}
      <div className={`${selectedPatient ? 'col-12 col-lg-4' : 'col-12'}`} style={{ borderRight: selectedPatient ? '1px solid var(--border)' : 'none' }}>
        <div className="p-3">
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <h5 style={{ fontWeight: 800, margin: 0 }}>
              <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)', verticalAlign: 'middle' }}>group</span>
              My Patients
            </h5>
            <div style={{ maxWidth: '220px', width: '100%' }}>
              <div className="position-relative">
                <span className="material-symbols-outlined position-absolute" style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ paddingLeft: '34px', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : patients.length === 0 ? (
            <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '48px', opacity: 0.3 }}>person_off</span>
              <h6 style={{ fontWeight: 700 }}>No patients found</h6>
            </div>
          ) : (
            <>
              <div className="d-flex flex-column gap-2">
                {patients.map((patient) => (
                  <div
                    key={patient._id}
                    className="card p-3"
                    style={{
                      border: selectedPatient?._id === patient._id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      background: selectedPatient?._id === patient._id ? 'var(--bg-light)' : 'var(--bg-card)',
                    }}
                    onClick={() => viewRecords(patient)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #e8f2fd, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', flexShrink: 0 }}>
                        {patient.name?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{patient.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📱 {patient.phone}</div>
                      </div>
                      <div className="text-end flex-shrink-0">
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8rem' }}>{patient.totalVisits || 0}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>visits</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3 gap-2">
                  <button className="btn btn-sm btn-outline-primary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
                  <span className="d-flex align-items-center" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{page}/{totalPages}</span>
                  <button className="btn btn-sm btn-outline-primary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Patient Detail + Prescriptions */}
      {selectedPatient && (
        <div className="col-12 col-lg-8">
          <div className="p-3">
            {/* Patient Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 800, margin: 0 }}>
                <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)', verticalAlign: 'middle' }}>person</span>
                {selectedPatient.name}
              </h5>
              <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={() => { setSelectedPatient(null); setPatientRecords(null); }}>← Back</button>
            </div>

            {/* Patient Info */}
            <div className="row g-2 mb-3" style={{ fontSize: '0.8rem' }}>
              <div className="col-6 col-md-3"><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{selectedPatient.phone}</strong></div>
              <div className="col-6 col-md-3"><span style={{ color: 'var(--text-muted)' }}>Gender:</span> <strong>{selectedPatient.gender || '-'}</strong></div>
              <div className="col-6 col-md-3"><span style={{ color: 'var(--text-muted)' }}>DOB:</span> <strong>{formatDate(selectedPatient.dateOfBirth)}</strong></div>
              <div className="col-6 col-md-3"><span style={{ color: 'var(--text-muted)' }}>Blood:</span> <strong>{selectedPatient.bloodGroup || '-'}</strong></div>
            </div>

            {msg && <div className={`alert py-2 mb-3 alert-${msgType}`} style={{ fontSize: '0.8rem' }}>{msg}</div>}

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3" style={{ fontSize: '0.85rem' }}>
              <li className="nav-item"><button className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Visit History</button></li>
              <li className="nav-item"><button className={`nav-link ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>Prescriptions</button></li>
              <li className="nav-item"><button className={`nav-link ${activeTab === 'new-rx' ? 'active' : ''}`} onClick={() => setActiveTab('new-rx')}>+ New Prescription</button></li>
            </ul>

            {recordsLoading ? (
              <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary"></div></div>
            ) : patientRecords ? (
              <>
                {/* Visit History Tab */}
                {activeTab === 'history' && (
                  <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    {patientRecords.appointments?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No visits yet.</p>
                    ) : (
                      patientRecords.appointments?.map((apt) => (
                        <div key={apt._id} className="d-flex align-items-center gap-2 p-2 mb-1" style={{ background: 'var(--bg-light)', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <span style={{ fontWeight: 600, minWidth: '80px' }}>{formatDate(apt.date)}</span>
                          {statusBadge(apt.status)}
                          <span style={{ color: 'var(--text-muted)' }}>{apt.startTime}-{apt.endTime}</span>
                          <span style={{ color: '#16a34a', fontWeight: 600, marginLeft: 'auto' }}>₹{apt.amount}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                  <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    {patientRecords.prescriptions?.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No prescriptions yet.</p>
                    ) : (
                      patientRecords.prescriptions?.map((rx) => (
                        <div key={rx._id} className="card p-3 mb-2" style={{ border: '1px solid var(--border)' }}>
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{formatDate(rx.createdAt)}</span>
                              <span className="badge ms-2" style={{
                                background: rx.status === 'FINAL' ? '#d1fae5' : '#fef3c7',
                                color: rx.status === 'FINAL' ? '#059669' : '#d97706',
                                fontWeight: 600, fontSize: '0.65rem',
                              }}>{rx.status}</span>
                            </div>
                            {rx.status === 'DRAFT' && (
                              <button className="btn btn-sm btn-success" style={{ fontSize: '0.7rem', padding: '2px 10px' }} onClick={() => handleFinalize(rx._id)}>
                                Finalize
                              </button>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem' }}>
                            <strong>Diagnosis:</strong> {rx.diagnosis || '-'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {rx.medicines?.length} medicine(s) | Symptoms: {rx.symptoms?.join(', ') || '-'}
                          </div>
                          {rx.medicines?.map((m, i) => (
                            <div key={i} style={{ fontSize: '0.7rem', color: '#4b5563', paddingLeft: '8px' }}>
                              💊 {m.name} {m.dosage} — {m.frequency} for {m.duration} {m.instructions && `(${m.instructions})`}
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* New Prescription Tab */}
                {activeTab === 'new-rx' && (
                  <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    <div className="mb-3">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Appointment *</label>
                      <select className="form-select form-select-sm" value={rxForm.appointmentId} onChange={e => setRxForm(prev => ({ ...prev, appointmentId: e.target.value }))}>
                        <option value="">Select appointment...</option>
                        {patientRecords.appointments?.filter(a => !['cancelled', 'no_show'].includes(a.status)).map(apt => (
                          <option key={apt._id} value={apt._id}>{formatDate(apt.date)} {apt.startTime} — {apt.status?.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Diagnosis</label>
                        <input className="form-control form-control-sm" value={rxForm.diagnosis} onChange={e => setRxForm(prev => ({ ...prev, diagnosis: e.target.value }))} placeholder="e.g. Upper Respiratory Infection" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Symptoms (comma-separated)</label>
                        <input className="form-control form-control-sm" value={rxForm.symptoms} onChange={e => setRxForm(prev => ({ ...prev, symptoms: e.target.value }))} placeholder="e.g. Cough, Fever, Cold" />
                      </div>
                    </div>

                    {/* Medicine Rows */}
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Medicines *
                      <button className="btn btn-sm btn-outline-primary ms-2" style={{ fontSize: '0.7rem', padding: '1px 8px' }} onClick={addMedicine}>+ Add</button>
                    </label>
                    {rxForm.medicines.map((med, i) => (
                      <div key={i} className="row g-1 mb-2 align-items-end">
                        <div className="col">
                          <input className="form-control form-control-sm" placeholder="Medicine name *" value={med.name} onChange={e => updateMedicine(i, 'name', e.target.value)} />
                        </div>
                        <div className="col-2">
                          <input className="form-control form-control-sm" placeholder="Dosage" value={med.dosage} onChange={e => updateMedicine(i, 'dosage', e.target.value)} />
                        </div>
                        <div className="col-2">
                          <input className="form-control form-control-sm" placeholder="Freq (1-0-1)" value={med.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} />
                        </div>
                        <div className="col-2">
                          <input className="form-control form-control-sm" placeholder="Duration" value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)} />
                        </div>
                        <div className="col-2">
                          <input className="form-control form-control-sm" placeholder="Instructions" value={med.instructions} onChange={e => updateMedicine(i, 'instructions', e.target.value)} />
                        </div>
                        <div className="col-auto">
                          {rxForm.medicines.length > 1 && (
                            <button className="btn btn-sm btn-outline-danger" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => removeMedicine(i)}>✕</button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="row g-2 mb-3 mt-2">
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Lab Tests (comma-separated)</label>
                        <input className="form-control form-control-sm" value={rxForm.labTests} onChange={e => setRxForm(prev => ({ ...prev, labTests: e.target.value }))} placeholder="e.g. CBC, X-Ray Chest" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Follow-up Date</label>
                        <input className="form-control form-control-sm" type="date" value={rxForm.followUpDate} onChange={e => setRxForm(prev => ({ ...prev, followUpDate: e.target.value }))} />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8rem' }}>Notes</label>
                      <textarea className="form-control form-control-sm" rows="2" value={rxForm.notes} onChange={e => setRxForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes..." />
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={handleSaveDraft} disabled={rxSaving}>
                        {rxSaving ? '...' : '💾 Save Draft'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocPatients;
