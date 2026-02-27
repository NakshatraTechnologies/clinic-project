import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const getDashboardLink = () => {
    if (user?.role === 'doctor') return '/doctor';
    if (user?.role === 'clinic_admin') return '/clinic';
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'receptionist') return '/receptionist';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (user?.role === 'doctor') return 'Doctor Portal';
    if (user?.role === 'clinic_admin') return 'Clinic Portal';
    if (user?.role === 'admin') return 'Admin Panel';
    if (user?.role === 'receptionist') return 'Front Desk';
    return 'My Dashboard';
  };

  return (
    <>
      <header className="clinic-navbar">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between" style={{ height: '56px' }}>
            <div className="d-flex align-items-center gap-4">
              <Link to="/" className="brand-logo">
                <span className="material-symbols-outlined icon">medical_services</span>
                <span>NakshatraClinic</span>
              </Link>
              <nav className="d-none d-md-flex align-items-center gap-1">
                <Link to="/doctors" className="nav-link">Find Doctors</Link>
                <Link to="/#how-it-works" className="nav-link">How It Works</Link>
                <a href="tel:+919209061234" className="nav-link d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#10b981' }}>call</span>
                  Helpline
                </a>
              </nav>
            </div>
            <div className="d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <div className="d-none d-md-flex align-items-center gap-2">
                  <Link to={getDashboardLink()} className="btn btn-primary btn-sm d-flex align-items-center gap-2" style={{ borderRadius: '50px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>
                    {getDashboardLabel()}
                  </Link>
                  <div className="dropdown">
                    <button className="btn btn-sm d-flex align-items-center gap-2" style={{ background: 'var(--primary-light)', borderRadius: '50px', padding: '6px 14px' }} data-bs-toggle="dropdown">
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                        fontWeight: 700, fontSize: '0.75rem'
                      }}>
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{user?.name || 'User'}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>expand_more</span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end" style={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', padding: '0.5rem', minWidth: '180px' }}>
                      <li><span className="dropdown-item-text" style={{ fontSize: '0.6875rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{user?.role?.replace('_', ' ')}</span></li>
                      <li><hr className="dropdown-divider" style={{ margin: '0.375rem 0' }} /></li>
                      <li><Link className="dropdown-item d-flex align-items-center gap-2" style={{ fontSize: '0.875rem', borderRadius: '8px', padding: '0.5rem 0.75rem' }} to={getDashboardLink()}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>dashboard</span>Dashboard</Link></li>
                      <li><hr className="dropdown-divider" style={{ margin: '0.375rem 0' }} /></li>
                      <li><button className="dropdown-item d-flex align-items-center gap-2 text-danger" style={{ fontSize: '0.875rem', borderRadius: '8px', padding: '0.5rem 0.75rem' }} onClick={handleLogout}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>Logout</button></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="d-none d-md-flex align-items-center gap-2">
                  <Link to="/login" className="nav-link" style={{ fontWeight: 600 }}>Log In</Link>
                  <Link to="/login" className="btn btn-primary btn-sm" style={{ borderRadius: '50px', padding: '0.5rem 1.25rem' }}>Get Started</Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="d-md-none btn p-1" style={{ border: 'none', background: 'none' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{mobileOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="d-md-none" style={{
          position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
          background: '#fff', zIndex: 1049, padding: '1.5rem',
          animation: 'fadeInDown 0.2s ease',
          overflowY: 'auto'
        }}>
          <div className="d-flex flex-column gap-1">
            <Link to="/doctors" onClick={() => setMobileOpen(false)} className="d-flex align-items-center gap-3 p-3" style={{ borderRadius: '12px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1rem', transition: 'background 0.2s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--primary)' }}>search</span>
              Find Doctors
            </Link>
            <Link to="/#how-it-works" onClick={() => setMobileOpen(false)} className="d-flex align-items-center gap-3 p-3" style={{ borderRadius: '12px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#10b981' }}>info</span>
              How It Works
            </Link>
            <a href="tel:+919209061234" className="d-flex align-items-center gap-3 p-3" style={{ borderRadius: '12px', textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 600, fontSize: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#f59e0b' }}>call</span>
              Helpline: 92090 61234
            </a>
            <hr style={{ margin: '0.75rem 0', borderColor: 'var(--border)' }} />
            {isAuthenticated ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)} className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 mb-2" style={{ borderRadius: '12px', padding: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>dashboard</span>
                  {getDashboardLabel()}
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2" style={{ borderRadius: '12px', padding: '0.75rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-primary w-100 mb-2" style={{ borderRadius: '12px', padding: '0.75rem', fontWeight: 700 }}>
                  Get Started
                </Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline-primary w-100" style={{ borderRadius: '12px', padding: '0.75rem', fontWeight: 600 }}>
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
