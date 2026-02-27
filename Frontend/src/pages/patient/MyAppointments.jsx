import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyAppointments, cancelAppointment } from '../../services/api';
import RescheduleModal from '../../components/RescheduleModal';

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [rescheduleAppt, setRescheduleAppt] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments();
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      await cancelAppointment(id, 'Cancelled by patient');
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const now = new Date();
  const upcoming = appointments.filter((a) => new Date(a.date) >= new Date(now.toDateString()) && !['cancelled', 'completed'].includes(a.status));
  const past = appointments.filter((a) => a.status === 'completed' || new Date(a.date) < new Date(now.toDateString()));
  const cancelled = appointments.filter((a) => a.status === 'cancelled');

  const displayList = tab === 'upcoming' ? upcoming : tab === 'past' ? past : cancelled;

  const formatDate = (d) => {
    const date = new Date(d);
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      time: '',
      full: date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    };
  };

  const statusBadge = (status) => {
    const map = {
      confirmed: { cls: 'status-confirmed', label: 'Confirmed' },
      pending: { cls: 'status-pending', label: 'Pending' },
      completed: { cls: 'status-completed', label: 'Completed' },
      cancelled: { cls: 'status-cancelled', label: 'Cancelled' },
      'no-show': { cls: 'status-cancelled', label: 'No Show' },
    };
    const s = map[status] || { cls: '', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ fontWeight: 800 }}>My Appointments</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage your visits, reschedule, and view history.</p>
        </div>
        <Link to="/doctors" className="btn btn-primary d-flex align-items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Book Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4" style={{ borderColor: 'var(--border)' }}>
        {[
          { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { key: 'past', label: 'Past History', count: past.length },
          { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
        ].map((t) => (
          <button
            key={t.key}
            className="px-3 py-2"
            style={{
              border: 'none',
              background: 'none',
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label} {t.count > 0 && <span style={{ fontSize: '0.75rem' }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner-border text-primary"></div></div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>event</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No {tab} appointments</h5>
          <p style={{ color: 'var(--text-muted)' }}>
            {tab === 'upcoming' ? 'Book a new appointment to get started.' : 'Nothing here yet.'}
          </p>
          {tab === 'upcoming' && <Link to="/doctors" className="btn btn-primary btn-sm">Find a Doctor</Link>}
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {displayList.map((appt) => {
            const dateInfo = formatDate(appt.date);
            return (
              <div key={appt._id} className="appointment-card">
                <div className="d-flex">
                  <div className="date-block">
                    <div className="month">{dateInfo.month}</div>
                    <div className="day">{dateInfo.day}</div>
                    <div className="time">
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                      {appt.startTime}
                    </div>
                  </div>
                  <div className="flex-grow-1 p-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                      <div className="d-flex gap-3">
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
                          {appt.doctorId?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <h6 style={{ fontWeight: 700, marginBottom: '0.125rem' }}>Dr. {appt.doctorId?.name || 'Unknown'}</h6>
                          <div style={{ color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: 600 }}>
                            {appt.type === 'walk-in' ? 'Walk-in' : 'In-person Visit'}
                          </div>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            {statusBadge(appt.status)}
                            {appt.rescheduleCount > 0 && (
                              <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.6875rem' }}>
                                Rescheduled ×{appt.rescheduleCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        {tab === 'upcoming' && appt.status !== 'cancelled' && (
                          <>
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1"
                              style={{ border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '8px' }}
                              onClick={() => setRescheduleAppt(appt)}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event_repeat</span>
                              Reschedule
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ border: '1px solid var(--border)', fontWeight: 600, fontSize: '0.8125rem', borderRadius: '8px' }}
                              onClick={() => handleCancel(appt._id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Past Appointments Table */}
      {tab === 'past' && past.length > 0 && (
        <div className="mt-4">
          <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>Past Appointments</h5>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem 1rem' }}>Doctor / Specialty</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Diagnosis</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((appt) => (
                    <tr key={appt._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                            {appt.doctorId?.name?.charAt(0) || 'D'}
                          </div>
                          <div>
                            <strong>Dr. {appt.doctorId?.name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{new Date(appt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{appt.startTime}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-dark)' }}>
                          {appt.notes || 'General Checkup'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/dashboard/records`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                          📄 Prescription
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <RescheduleModal
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={() => { setRescheduleAppt(null); fetchAppointments(); }}
        />
      )}
    </div>
  );
};

export default MyAppointments;
