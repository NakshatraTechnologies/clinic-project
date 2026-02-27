import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const AdminLayout = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, user]);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;
  if (!user || user.role !== 'admin') return null;

  const links = [
    { to: '/admin', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/admin/clinics', icon: 'local_hospital', label: 'Clinics' },
    { to: '/admin/doctors', icon: 'stethoscope', label: 'Doctors' },
    { to: '/admin/users', icon: 'group', label: 'Users' },
    { to: '/admin/subscriptions', icon: 'credit_card', label: 'Subscriptions' },
    { to: '/admin/settings', icon: 'settings', label: 'Settings' },
    { to: '/admin/support', icon: 'support_agent', label: 'Support' },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <aside className="admin-sidebar d-none d-lg-block">
        <div className="px-4 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.875rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>shield_person</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Super Admin</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>Platform Control</div>
            </div>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0 }}>
          <button onClick={() => { logout(); navigate('/'); }} className="admin-sidebar-link w-100 text-start" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="admin-mobile-nav d-lg-none">
        {links.slice(0, 5).map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `admin-mobile-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <main className="admin-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
