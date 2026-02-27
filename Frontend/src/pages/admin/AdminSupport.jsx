const AdminSupport = () => {
  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#dc2626', fontSize: '28px', verticalAlign: 'middle' }}>support_agent</span>
          Support & Tickets
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Handle clinic support requests and issue tickets.</p>
      </div>

      <div className="card p-5 text-center" style={{ border: '2px dashed var(--border)', background: '#fafafa' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '36px' }}>confirmation_number</span>
        </div>
        <h4 style={{ fontWeight: 800 }}>Support Ticketing System</h4>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 1.5rem', lineHeight: 1.6 }}>
          Clinics will be able to raise tickets when they face issues. You'll be able to view, assign, and resolve them right from here.
        </p>

        <div className="row g-3 justify-content-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
          {[
            { icon: 'inbox', label: 'Open Tickets', value: '—' },
            { icon: 'hourglass_top', label: 'In Progress', value: '—' },
            { icon: 'check_circle', label: 'Resolved', value: '—' },
          ].map(s => (
            <div className="col-4" key={s.label}>
              <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--text-light)', fontSize: '24px' }}>{s.icon}</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.25rem 0' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-muted)', fontWeight: 600, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
            🚀 Coming Soon — Needs Ticket Model & API
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
