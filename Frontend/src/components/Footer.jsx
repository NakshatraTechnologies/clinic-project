import { Link } from 'react-router-dom';

const Footer = () => (
  <footer style={{
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
    color: '#94a3b8', padding: '4rem 0 0'
  }}>
    <div className="container">
      <div className="row g-4 pb-4">
        {/* Brand */}
        <div className="col-lg-4 col-md-6">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #137fec, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>medical_services</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>NakshatraClinic</span>
          </div>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '320px', marginBottom: '1.5rem' }}>
            Making healthcare accessible, transparent, and efficient. Find trusted doctors and book appointments instantly.
          </p>
          <div className="d-flex gap-3">
            {[
              { icon: '📞', href: 'tel:+919209061234', label: '92090 61234' },
              { icon: '✉️', href: 'mailto:support@nakshatraclinic.com', label: 'Email Us' },
            ].map(c => (
              <a key={c.label} href={c.href} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500 }} className="d-flex align-items-center gap-1">
                {c.icon} {c.label}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="col-lg-2 col-md-6 col-6">
          <h6 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>For Patients</h6>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { label: 'Find Doctors', to: '/doctors' },
              { label: 'Book Appointment', to: '/doctors' },
              { label: 'Login / Register', to: '/login' },
              { label: 'My Dashboard', to: '/dashboard' },
            ].map(l => (
              <li key={l.label} style={{ marginBottom: '0.625rem' }}>
                <Link to={l.to} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-lg-2 col-md-6 col-6">
          <h6 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>For Doctors</h6>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {[
              { label: 'Join as Doctor', to: '/login' },
              { label: 'Doctor Dashboard', to: '/login' },
              { label: 'Manage Profile', to: '/login' },
              { label: 'View Patients', to: '/login' },
            ].map(l => (
              <li key={l.label} style={{ marginBottom: '0.625rem' }}>
                <Link to={l.to} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#fff'}
                  onMouseLeave={e => e.target.style.color = '#94a3b8'}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="col-lg-4 col-md-6">
          <h6 style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>Need Help?</h6>
          <p style={{ fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            Have questions about appointments, payments, or your account? Our support team is here to help.
          </p>
          <div className="d-flex flex-column gap-2">
            <a href="tel:+919209061234" style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.75rem 1rem',
              color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem',
              border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#10b981' }}>call</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>+91 92090 61234</div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Mon-Sat, 9AM-8PM</div>
              </div>
            </a>
            <a href="mailto:support@nakshatraclinic.com" style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '0.75rem 1rem',
              color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem',
              border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.2s'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#3b82f6' }}>mail</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>support@nakshatraclinic.com</div>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>We reply within 24 hours</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem 0' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <p style={{ color: '#64748b', fontSize: '0.8125rem', margin: 0 }}>© 2026 NakshatraClinic. All rights reserved.</p>
          <div className="d-flex gap-4">
            <a href="#" style={{ color: '#64748b', fontSize: '0.8125rem', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#64748b', fontSize: '0.8125rem', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: '#64748b', fontSize: '0.8125rem', textDecoration: 'none' }}>Refund Policy</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
