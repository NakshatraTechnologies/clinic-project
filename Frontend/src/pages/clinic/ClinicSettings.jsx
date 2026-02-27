import { useState, useEffect } from 'react';
import { getClinicDashboard } from '../../services/api';

const ClinicSettings = () => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClinicDashboard()
      .then(res => setClinic(res.data.clinic))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>;

  const sections = [
    { name: 'Clinic Profile', desc: 'Edit your clinic name, address, logo, contact details, and description.', icon: 'domain', color: '#0d9488' },
    { name: 'Working Hours', desc: 'Set your clinic\'s operating hours — weekday and weekend schedules.', icon: 'schedule', color: '#3b82f6' },
    { name: 'Appointment Settings', desc: 'Default slot duration, buffer time between appointments, and booking rules.', icon: 'event_available', color: '#7c3aed' },
    { name: 'Notifications', desc: 'Configure SMS/email reminders for patients about upcoming appointments.', icon: 'notifications', color: '#d97706' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#3b82f6', fontSize: '28px', verticalAlign: 'middle' }}>settings</span>
          Clinic Settings
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage your clinic's profile and preferences.</p>
      </div>

      {/* Current Info */}
      {clinic && (
        <div className="card p-4 mb-4" style={{ border: '1px solid var(--border)' }}>
          <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
            <span className="material-symbols-outlined" style={{ color: '#0d9488', fontSize: '20px' }}>info</span>
            Current Clinic Info
          </h6>
          <div className="row g-3">
            {[
              { label: 'Clinic Name', value: clinic.name || '—' },
              { label: 'Plan', value: (clinic.subscriptionPlan || 'free').charAt(0).toUpperCase() + (clinic.subscriptionPlan || 'free').slice(1) },
              { label: 'Expiry', value: clinic.subscriptionExpiry ? new Date(clinic.subscriptionExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No expiry' },
            ].map(item => (
              <div className="col-md-4" key={item.label}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon Sections */}
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

export default ClinicSettings;
