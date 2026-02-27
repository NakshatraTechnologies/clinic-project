import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const DoctorDashboardLayout = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
    if (!loading && isAuthenticated && user?.role !== 'doctor') navigate('/dashboard');
  }, [loading, isAuthenticated, user]);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;

  const links = [
    { to: '/doctor', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/doctor/appointments', icon: 'calendar_month', label: 'Appointments' },
    { to: '/doctor/patients', icon: 'group', label: 'My Patients' },
    { to: '/doctor/prescriptions', icon: 'clinical_notes', label: 'Prescriptions' },
    { to: '/doctor/profile', icon: 'person', label: 'Profile & Schedule' },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <aside className="doctor-sidebar d-none d-lg-block">
        <div className="px-4 pb-4 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user?.name || 'Doctor'}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Doctor Portal</div>
            </div>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0 }}>
          <button onClick={() => { logout(); navigate('/'); }} className="sidebar-link w-100 text-start" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="doc-mobile-nav d-lg-none">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `doc-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <main className="doctor-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorDashboardLayout;

