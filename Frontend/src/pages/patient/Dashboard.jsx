import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const Dashboard = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/login');
    // Redirect non-patient roles to their correct dashboard
    if (!loading && isAuthenticated && user?.role) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'clinic_admin') navigate('/clinic', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else if (user.role === 'receptionist') navigate('/receptionist', { replace: true });
    }
  }, [loading, isAuthenticated, user]);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;

  const links = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/appointments', icon: 'calendar_month', label: 'My Appointments' },
    { to: '/dashboard/records', icon: 'description', label: 'Medical Records' },
    { to: '/dashboard/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <aside className="patient-sidebar d-none d-lg-block">
        <div className="px-4 pb-4 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.875rem' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user?.name || 'User'}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Patient Portal</div>
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

      {/* Content */}
      <main className="patient-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;
