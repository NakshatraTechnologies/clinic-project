import { useState, useEffect, useRef } from 'react';
import { getTodayQueue, updateQueueStatus, callNextPatient } from '../../services/api';

const LiveQueue = () => {
  const [queue, setQueue] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchQueue();
    intervalRef.current = setInterval(fetchQueue, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await getTodayQueue();
      setQueue(res.data.queue);
      setPatients(res.data.queue?.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (appointmentId, status) => {
    try {
      setMsg('');
      await updateQueueStatus(appointmentId, { status });
      setMsg(`Patient marked as ${status}`);
      fetchQueue();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCallNext = async () => {
    try {
      setMsg('');
      const res = await callNextPatient();
      setMsg(res.data.message || 'Next patient called!');
      fetchQueue();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to call next patient');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  const waiting = patients.filter(p => p.status === 'waiting');
  const inConsultation = patients.filter(p => p.status === 'in-consultation');
  const completed = patients.filter(p => p.status === 'completed');
  const skipped = patients.filter(p => p.status === 'skipped');

  const statusColors = {
    waiting: { bg: '#fef3c7', color: '#d97706' },
    'in-consultation': { bg: '#dbeafe', color: '#2563eb' },
    completed: { bg: '#d1fae5', color: '#059669' },
    skipped: { bg: '#fee2e2', color: '#dc2626' },
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#2563eb', fontSize: '28px', verticalAlign: 'middle' }}>queue</span>
            Live Queue
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Auto-refreshes every 15 seconds • Current Token: <strong>#{queue?.currentToken || 0}</strong> • Total Issued: <strong>{queue?.totalTokensIssued || 0}</strong>
          </p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleCallNext}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>skip_next</span>
          Call Next Patient
        </button>
      </div>

      {msg && <div className={`alert py-2 mb-3 ${msg.includes('Failed') ? 'alert-danger' : 'alert-success'}`} style={{ fontSize: '0.875rem' }}>{msg}</div>}

      {/* Summary Badges */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <span className="badge d-flex align-items-center gap-1" style={{ background: '#fef3c7', color: '#d97706', fontWeight: 600, fontSize: '0.8125rem', padding: '6px 14px' }}>
          ⏳ Waiting: {waiting.length}
        </span>
        <span className="badge d-flex align-items-center gap-1" style={{ background: '#dbeafe', color: '#2563eb', fontWeight: 600, fontSize: '0.8125rem', padding: '6px 14px' }}>
          🔵 In Consultation: {inConsultation.length}
        </span>
        <span className="badge d-flex align-items-center gap-1" style={{ background: '#d1fae5', color: '#059669', fontWeight: 600, fontSize: '0.8125rem', padding: '6px 14px' }}>
          ✅ Completed: {completed.length}
        </span>
        <span className="badge d-flex align-items-center gap-1" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 600, fontSize: '0.8125rem', padding: '6px 14px' }}>
          ⏭️ Skipped: {skipped.length}
        </span>
      </div>

      {/* Queue List */}
      {patients.length === 0 ? (
        <div className="card p-5 text-center" style={{ border: '1px solid var(--border)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-light)' }}>group_off</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No patients in queue</h5>
          <p style={{ color: 'var(--text-muted)' }}>Register a walk-in or wait for online bookings to check in.</p>
        </div>
      ) : (
        <div className="row g-3">
          {patients.map((p) => (
            <div className="col-md-6 col-xl-4" key={p._id}>
              <div className="card h-100" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '4px', background: statusColors[p.status]?.color || '#6b7280' }}></div>
                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: p.status === 'in-consultation' ? '#2563eb' : p.status === 'completed' ? '#059669' : '#d97706',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: '0.875rem'
                      }}>
                        #{p.tokenNumber}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{p.patientId?.name || `Patient #${p.tokenNumber}`}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {p.checkInTime ? `Checked in: ${new Date(p.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : '—'}
                        </div>
                      </div>
                    </div>
                    <span className="badge" style={{ background: statusColors[p.status]?.bg, color: statusColors[p.status]?.color, fontWeight: 600, fontSize: '0.6875rem', textTransform: 'capitalize' }}>
                      {p.status.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  {(p.status === 'waiting' || p.status === 'in-consultation') && (
                    <div className="d-flex gap-2 mt-2">
                      {p.status === 'waiting' && (
                        <>
                          <button className="btn btn-sm btn-outline-primary flex-fill" style={{ fontSize: '0.75rem' }} onClick={() => handleStatus(p.appointmentId, 'in-consultation')}>
                            🔵 Start Consult
                          </button>
                          <button className="btn btn-sm btn-outline-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleStatus(p.appointmentId, 'skipped')}>
                            Skip
                          </button>
                        </>
                      )}
                      {p.status === 'in-consultation' && (
                        <button className="btn btn-sm btn-success flex-fill" style={{ fontSize: '0.75rem' }} onClick={() => handleStatus(p.appointmentId, 'completed')}>
                          ✅ Mark Completed
                        </button>
                      )}
                    </div>
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

export default LiveQueue;
