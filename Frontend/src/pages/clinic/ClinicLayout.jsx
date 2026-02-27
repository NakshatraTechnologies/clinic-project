import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { getClinicDashboard } from '../../services/api';

const ClinicLayout = () => {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'clinic_admin')) {
      navigate('/dashboard');
    }
  }, [loading, isAuthenticated, user]);

  useEffect(() => {
    if (user?.role === 'clinic_admin') {
      getClinicDashboard()
        .then(res => setClinicName(res.data.clinic?.name || ''))
        .catch(() => {});
    }
  }, [user]);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;
  if (!user || user.role !== 'clinic_admin') return null;

  const links = [
    { to: '/clinic', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/clinic/doctors', icon: 'stethoscope', label: 'Doctors' },
    { to: '/clinic/receptionists', icon: 'support_agent', label: 'Receptionists' },
    { to: '/clinic/inventory', icon: 'inventory_2', label: 'Inventory' },
    { to: '/clinic/settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <aside className="clinic-sidebar d-none d-lg-block">
        <div className="px-4 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #14b8a6, #0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9375rem' }}>
              {clinicName?.charAt(0) || 'C'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clinicName || 'My Clinic'}</div>
              <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)' }}>Clinic Admin</div>
            </div>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `clinic-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '1.5rem', left: 0, right: 0 }}>
          <button onClick={() => { logout(); navigate('/'); }} className="clinic-sidebar-link w-100 text-start" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="clinic-mobile-nav d-lg-none">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `clinic-mobile-link ${isActive ? 'active' : ''}`}>
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <main className="clinic-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
};

export default ClinicLayout;
