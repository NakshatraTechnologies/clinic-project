import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const ReceptionistLayout = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'receptionist')) {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, user]);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;
  if (!user || user.role !== 'receptionist') return null;

  const links = [
    { to: '/receptionist', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/receptionist/walk-in', icon: 'person_add', label: 'Walk-In' },
    { to: '/receptionist/queue', icon: 'queue', label: 'Live Queue' },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <aside className="recep-sidebar d-none d-lg-block">
        <div className="px-4 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #e11d48, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>
              {user?.name?.charAt(0) || 'R'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Receptionist'}</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>Front Desk</div>
            </div>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `recep-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0 }}>
          <button onClick={() => { logout(); navigate('/'); }} className="recep-sidebar-link w-100 text-start" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="recep-mobile-nav d-lg-none">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `recep-mobile-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <main className="recep-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default ReceptionistLayout;
