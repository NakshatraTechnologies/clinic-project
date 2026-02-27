import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReceptionistTodaySummary, receptionistCollectPayment } from '../../services/api';

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({ paymentMethod: 'cash', amount: '', transactionId: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const res = await getReceptionistTodaySummary();
      setStats(res.data.stats);
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (appointmentId) => {
    try {
      setMsg('');
      await receptionistCollectPayment(appointmentId, payForm);
      setMsg('Payment collected!');
      setPayingId(null);
      fetchSummary();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to collect payment');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  const kpiCards = [
    { icon: 'event', label: 'Total Appointments', value: stats?.totalAppointments || 0, gradient: 'linear-gradient(135deg, #e11d48, #f43f5e)', sub: 'Today' },
    { icon: 'computer', label: 'Online Bookings', value: stats?.online || 0, gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', sub: 'Pre-booked' },
    { icon: 'directions_walk', label: 'Walk-Ins', value: stats?.walkIn || 0, gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', sub: 'Registered today' },
    { icon: 'check_circle', label: 'Completed', value: stats?.completed || 0, gradient: 'linear-gradient(135deg, #059669, #10b981)', sub: 'Done for today' },
    { icon: 'currency_rupee', label: 'Collected', value: `₹${(stats?.totalCollected || 0).toLocaleString('en-IN')}`, gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', sub: 'Payments received' },
    { icon: 'pending', label: 'Pending Amount', value: `₹${(stats?.totalPending || 0).toLocaleString('en-IN')}`, gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', sub: 'Yet to collect' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#e11d48', fontSize: '28px', verticalAlign: 'middle' }}>dashboard</span>
            Today's Dashboard
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/receptionist/walk-in" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span> New Walk-In
          </Link>
          <Link to="/receptionist/queue" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>queue</span> Live Queue
          </Link>
        </div>
      </div>

      {msg && <div className={`alert py-2 mb-3 ${msg.includes('collected') ? 'alert-success' : 'alert-danger'}`} style={{ fontSize: '0.875rem' }}>{msg}</div>}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card) => (
          <div className="col-6 col-lg-4 col-xl-2" key={card.label}>
            <div className="card h-100 recep-kpi-card" style={{ border: 'none', overflow: 'hidden' }}>
              <div style={{ background: card.gradient, padding: '1.25rem' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{card.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{card.value}</div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '18px' }}>{card.icon}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>{card.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Appointments Table */}
      <h6 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
        <span className="material-symbols-outlined me-1" style={{ fontSize: '18px', color: '#e11d48', verticalAlign: 'middle' }}>list_alt</span>
        Today's Appointments
      </h6>
      {appointments.length === 0 ? (
        <div className="card p-5 text-center" style={{ border: '1px solid var(--border)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-light)' }}>event_busy</span>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>No appointments for today yet.</p>
        </div>
      ) : (
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Time', 'Patient', 'Phone', 'Type', 'Status', 'Amount', 'Payment', 'Action'].map(h => (
                    <th key={h} style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', fontWeight: 600 }}>{apt.startTime} - {apt.endTime}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{apt.patientId?.name || '—'}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{apt.patientId?.phone || '—'}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: apt.type === 'walk-in' ? '#f5f3ff' : '#eff6ff', color: apt.type === 'walk-in' ? '#7c3aed' : '#2563eb', fontWeight: 600, fontSize: '0.6875rem' }}>
                        {apt.type === 'walk-in' ? '🚶 Walk-In' : '💻 Online'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{
                        background: apt.status === 'completed' ? '#d1fae5' : apt.status === 'confirmed' ? '#dbeafe' : apt.status === 'cancelled' ? '#fee2e2' : '#f0f2f4',
                        color: apt.status === 'completed' ? '#059669' : apt.status === 'confirmed' ? '#2563eb' : apt.status === 'cancelled' ? '#dc2626' : '#6b7280',
                        fontWeight: 600, fontSize: '0.6875rem', textTransform: 'capitalize'
                      }}>
                        {apt.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>₹{apt.amount || 0}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{
                        background: apt.paymentStatus === 'paid' ? '#d1fae5' : '#fef3c7',
                        color: apt.paymentStatus === 'paid' ? '#059669' : '#d97706',
                        fontWeight: 600, fontSize: '0.6875rem', textTransform: 'capitalize'
                      }}>
                        {apt.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {apt.paymentStatus !== 'paid' && apt.status !== 'cancelled' ? (
                        payingId === apt._id ? (
                          <div className="d-flex gap-1 align-items-center">
                            <select className="form-select form-select-sm" style={{ width: '80px', fontSize: '0.75rem' }} value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="online">Online</option>
                            </select>
                            <button className="btn btn-sm btn-success" style={{ fontSize: '0.6875rem', padding: '2px 8px' }} onClick={() => handleCollect(apt._id)}>✓</button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.6875rem', padding: '2px 6px' }} onClick={() => setPayingId(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm btn-outline-success" style={{ fontSize: '0.75rem', padding: '2px 10px' }} onClick={() => { setPayingId(apt._id); setPayForm({ paymentMethod: 'cash', amount: apt.amount, transactionId: '' }); }}>
                            💰 Collect
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionistDashboard;
