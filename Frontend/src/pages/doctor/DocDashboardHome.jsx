import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDoctorDashboard } from '../../services/api';
import { Link } from 'react-router-dom';

const DocDashboardHome = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getDoctorDashboard();
        setDashboard(res.data.dashboard);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  const today = dashboard?.today || {};
  const upcoming = dashboard?.upcoming || [];
  const monthly = dashboard?.monthly || {};
  const overall = dashboard?.overall || {};
  const queue = dashboard?.queue;

  const statCards = [
    { icon: 'event_available', label: "Today's Appointments", value: today.total || 0, color: '#137fec', bg: '#e8f2fd' },
    { icon: 'bookmark_added', label: 'Booked', value: (today.booked || 0) + (today.pending || 0), color: '#0891b2', bg: '#cffafe' },
    { icon: 'check_circle', label: 'Completed', value: today.completed || 0, color: '#22c55e', bg: '#dcfce7' },
    { icon: 'currency_rupee', label: "Today's Revenue", value: `₹${(today.revenue || 0).toLocaleString()}`, color: '#7c3aed', bg: '#ede9fe' },
    { icon: 'trending_up', label: 'Monthly Revenue', value: `₹${(monthly.revenue || 0).toLocaleString()}`, color: '#0ea5e9', bg: '#e0f2fe' },
    { icon: 'group', label: 'Total Patients', value: overall.totalPatients || 0, color: '#f97316', bg: '#fff7ed' },
  ];

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
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  };

  return (
    <div>
      {/* Welcome Header */}
      <div className="doc-welcome-banner mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <h3 style={{ fontWeight: 800, marginBottom: '0.25rem' }}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, <span style={{ color: 'var(--primary)' }}>Dr. {user?.name?.split(' ').pop() || ''}</span> 👋
            </h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {queue && (
            <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ background: '#dcfce7', borderRadius: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#16a34a' }}>queue</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Queue Active</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#166534' }}>Token #{queue.currentToken}/{queue.totalTokensIssued}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map((stat) => (
          <div className="col-6 col-md-4 col-xl-2" key={stat.label}>
            <div className="doc-stat-card">
              <div className="stat-icon" style={{ background: stat.bg }}>
                <span className="material-symbols-outlined" style={{ color: stat.color, fontSize: '22px' }}>{stat.icon}</span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Appointments + Quick Actions */}
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card p-4" style={{ border: '1px solid var(--border)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>today</span>
                Today's Appointments
              </h5>
              <Link to="/doctor/appointments" className="btn btn-outline-primary btn-sm">View All</Link>
            </div>

            {today.appointments?.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '48px', opacity: 0.3 }}>event_busy</span>
                No appointments today
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>TIME</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>PATIENT</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>TYPE</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>STATUS</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>PAYMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {today.appointments?.slice(0, 8).map((apt) => (
                      <tr key={apt._id}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatTime(apt.startTime)}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{apt.patientId?.name || 'Patient'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.patientId?.phone}</div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: apt.type === 'walk-in' ? '#fff7ed' : '#ede9fe',
                            color: apt.type === 'walk-in' ? '#c2410c' : '#6d28d9'
                          }}>
                            {apt.type === 'walk-in' ? '🚶 Walk-in' : '📱 Online'}
                          </span>
                        </td>
                        <td>{getStatusBadge(apt.status)}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: apt.paymentStatus === 'paid' ? '#16a34a' : '#f59e0b' }}>
                            {apt.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Appointments */}
          {upcoming.length > 0 && (
            <div className="card p-4 mt-3" style={{ border: '1px solid var(--border)' }}>
              <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                <span className="material-symbols-outlined me-2" style={{ color: '#0891b2' }}>upcoming</span>
                Upcoming ({upcoming.length})
              </h5>
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>DATE</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>TIME</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>PATIENT</th>
                      <th style={{ border: 0, padding: '0.5rem 0.75rem' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((apt) => (
                      <tr key={apt._id}>
                        <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {new Date(apt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatTime(apt.startTime)}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{apt.patientId?.name || 'Patient'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.patientId?.phone}</div>
                        </td>
                        <td>{getStatusBadge(apt.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="col-lg-4">
          <div className="card p-4 mb-3" style={{ border: '1px solid var(--border)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)', fontSize: '20px' }}>bolt</span>
              Quick Actions
            </h6>
            <div className="d-grid gap-2">
              <Link to="/doctor/appointments" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event_note</span>
                Manage Appointments
              </Link>
              <Link to="/doctor/patients" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
                View Patients
              </Link>
              <Link to="/doctor/prescriptions" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>clinical_notes</span>
                Prescriptions
              </Link>
              <Link to="/doctor/profile" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                Schedule & Profile
              </Link>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="card p-4" style={{ border: '1px solid var(--border)', background: 'linear-gradient(135deg, #ede9fe 0%, #f6f7f8 100%)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
              💰 Revenue Summary
            </h6>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Today's Revenue</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>₹{(today.revenue || 0).toLocaleString()}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pending Payments</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹{(today.pendingPayments || 0).toLocaleString()}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            <div className="d-flex justify-content-between">
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>This Month</span>
              <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: '1.1rem' }}>₹{(monthly.revenue || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocDashboardHome;

