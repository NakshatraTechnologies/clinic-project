const AdminSettings = () => {
  const sections = [
    { name: 'CMS — Landing Page', desc: 'Edit testimonials, FAQs, banners, and hero content on the public website.', icon: 'web', color: '#3b82f6' },
    { name: 'Broadcast Notifications', desc: 'Send announcements to all clinics & doctors — maintenance alerts, feature updates, etc.', icon: 'campaign', color: '#dc2626' },
    { name: 'SMTP / SMS Config', desc: 'Configure email (SMTP) and SMS gateway API keys for transactional messages.', icon: 'sms', color: '#059669' },
    { name: 'Platform Settings', desc: 'Logo, platform name, timezone, default currency, and other global configurations.', icon: 'tune', color: '#7c3aed' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#7c3aed', fontSize: '28px', verticalAlign: 'middle' }}>settings</span>
          Settings & Configuration
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Master control panel for platform-wide configurations.</p>
      </div>

      <div className="row g-3">
        {sections.map((s) => (
          <div className="col-md-6" key={s.name}>
            <div className="card h-100 p-4" style={{ border: '2px dashed var(--border)', background: '#fafafa' }}>
              <div className="d-flex gap-3 align-items-start">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: s.color, fontSize: '24px' }}>{s.icon}</span>
                </div>
                <div>
                  <h6 style={{ fontWeight: 700 }}>{s.name}</h6>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>{s.desc}</p>
                  <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem' }}>
                    🚀 Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
