import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getPatientStats } from '../../services/api';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ upcoming: 0, completed: 0, prescriptions: 0, savedDoctors: 0 });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await getPatientStats();
      setStats(res.data.stats || {});
      setNextAppointment(res.data.nextAppointment || null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickStats = [
    { icon: 'calendar_month', label: 'Upcoming', value: stats.upcoming, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { icon: 'check_circle', label: 'Completed', value: stats.completed, color: '#16a34a', bg: '#dcfce7' },
    { icon: 'description', label: 'Prescriptions', value: stats.prescriptions, color: '#7c3aed', bg: '#ede9fe' },
    { icon: 'favorite', label: 'Saved Doctors', value: stats.savedDoctors, color: '#dc2626', bg: '#fee2e2' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.name || 'there'}</span>! 👋
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>Here's your health summary at a glance.</p>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        {quickStats.map((stat) => (
          <div className="col-6 col-md-3" key={stat.label}>
            <div className="card p-3 h-100" style={{ border: '1px solid var(--border)' }}>
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: stat.color }}>{stat.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>
                    {loading ? <div className="spinner-border spinner-border-sm text-primary"></div> : stat.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Appointment Card */}
      {nextAppointment && (
        <div className="card mb-4" style={{ border: '1px solid var(--border)', borderLeft: '4px solid var(--primary)', overflow: 'hidden' }}>
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  📅 Next Appointment
                </div>
                <h5 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                  Dr. {nextAppointment.doctorId?.name || 'Doctor'}
                </h5>
                <div className="d-flex flex-wrap gap-3" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <span className="d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                    {new Date(nextAppointment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    {nextAppointment.startTime}
                  </span>
                  <span className={`badge ${nextAppointment.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`} style={{ fontSize: '0.6875rem' }}>
                    {nextAppointment.status}
                  </span>
                </div>
              </div>
              <Link to="/dashboard/appointments" className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px', fontWeight: 600 }}>
                View All →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card p-4 h-100" style={{ border: '1px solid var(--border)' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>search</span>
              Find a Doctor
            </h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Search for specialists, view profiles, and book appointments instantly.
            </p>
            <Link to="/doctors" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
              Search Doctors →
            </Link>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-4 h-100" style={{ border: '1px solid var(--border)' }}>
            <h5 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)' }}>calendar_month</span>
              My Appointments
            </h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              View your upcoming appointments, history, and manage bookings.
            </p>
            <Link to="/dashboard/appointments" className="btn btn-outline-primary btn-sm" style={{ width: 'fit-content' }}>
              View Appointments →
            </Link>
          </div>
        </div>
      </div>

      {/* Health Tips */}
      <div className="card p-4" style={{ border: '1px solid var(--border)', background: 'linear-gradient(135deg, var(--primary-light) 0%, #f6f7f8 100%)' }}>
        <h6 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
          💡 Health Tip of the Day
        </h6>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Regular health check-ups can help detect problems early. Schedule your annual check-up today and stay ahead of your health.
        </p>
      </div>
    </div>
  );
};

export default DashboardHome;
