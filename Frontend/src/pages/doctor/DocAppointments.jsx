import { useState, useEffect } from 'react';
import { getDoctorAppointments, updateAppointmentStatus } from '../../services/api';

const DocAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (dateFilter) params.date = dateFilter;
      if (filter !== 'all') params.status = filter;
      const res = await getDoctorAppointments(params);
      setAppointments(res.data.appointments || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAppointments(); }, [filter, dateFilter, page]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      fetchAppointments();
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      booked: { bg: '#cffafe', color: '#155e75', label: 'Booked' },
      pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
      checked_in: { bg: '#fef3c7', color: '#92400e', label: 'Checked In' },
      in_consultation: { bg: '#ede9fe', color: '#7c3aed', label: 'In Consultation' },
      completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
      cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
      'no-show': { bg: '#f3f4f6', color: '#374151', label: 'No Show' },
      no_show: { bg: '#f3f4f6', color: '#374151', label: 'No Show' },
    };
    const s = map[status] || map.pending;
    return <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const filters = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'booked', label: 'Booked', icon: 'bookmark_added' },
    { key: 'pending', label: 'Pending', icon: 'pending_actions' },
    { key: 'confirmed', label: 'Confirmed', icon: 'event_available' },
    { key: 'completed', label: 'Completed', icon: 'check_circle' },
    { key: 'cancelled', label: 'Cancelled', icon: 'cancel' },
  ];

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <h4 style={{ fontWeight: 800, margin: 0 }}>
          <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>calendar_month</span>
          Appointments
        </h4>
        <div className="d-flex align-items-center gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            style={{ maxWidth: '180px' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`btn btn-sm d-flex align-items-center gap-1 ${filter === f.key ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => { setFilter(f.key); setPage(1); }}
            style={{ borderRadius: '20px', fontSize: '0.8rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{f.icon}</span>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '56px', opacity: 0.3 }}>event_busy</span>
          <h5 style={{ fontWeight: 700 }}>No appointments found</h5>
          <p style={{ fontSize: '0.875rem' }}>Try changing the date or filter.</p>
        </div>
      ) : (
        <>
          {/* Appointment Cards */}
          <div className="row g-3">
            {appointments.map((apt) => (
              <div className="col-12" key={apt._id}>
                <div className="card p-3 d-flex flex-row align-items-center gap-3" style={{ border: '1px solid var(--border)' }}>
                  {/* Time */}
                  <div className="text-center px-3" style={{ minWidth: '90px', borderRight: '2px solid var(--border)' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{formatTime(apt.startTime)}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>to {formatTime(apt.endTime)}</div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{apt.patientId?.name || 'Patient'}</span>
                      {getStatusBadge(apt.status)}
                      <span className="badge" style={{
                        background: apt.type === 'walk-in' ? '#fff7ed' : '#ede9fe',
                        color: apt.type === 'walk-in' ? '#c2410c' : '#6d28d9'
                      }}>
                        {apt.type === 'walk-in' ? 'Walk-in' : 'Online'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📱 {apt.patientId?.phone || '-'} &nbsp; | &nbsp; 💰 ₹{apt.amount || 0}
                      <span style={{ color: apt.paymentStatus === 'paid' ? '#16a34a' : '#f59e0b', fontWeight: 600, marginLeft: '0.5rem' }}>
                        ({apt.paymentStatus})
                      </span>
                    </div>
                    {apt.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>📝 {apt.notes}</div>}
                  </div>

                  {/* Actions */}
                  <div className="d-flex gap-2 flex-shrink-0">
                    {apt.status === 'pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusUpdate(apt._id, 'confirmed')} style={{ fontSize: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>check</span> Confirm
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button className="btn btn-sm btn-success" onClick={() => handleStatusUpdate(apt._id, 'completed')} style={{ fontSize: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>done_all</span> Complete
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(apt.status) && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleStatusUpdate(apt._id, 'cancelled')} style={{ fontSize: '0.75rem' }}>
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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

export default DocAppointments;

