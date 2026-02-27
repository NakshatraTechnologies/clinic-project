import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClinicDashboard } from '../../services/api';

const ClinicDashboard = () => {
  const [data, setData] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getClinicDashboard();
      setData(res.data.dashboard);
      setClinic(res.data.clinic);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  const planColors = { free: '#6b7280', professional: '#2563eb', enterprise: '#d97706' };

  const kpiCards = [
    { icon: 'stethoscope', label: 'Doctors', value: data?.totalDoctors || 0, gradient: 'linear-gradient(135deg, #0d9488, #14b8a6)', sub: 'Onboarded to clinic' },
    { icon: 'support_agent', label: 'Receptionists', value: data?.totalReceptionists || 0, gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', sub: 'Managing front desk' },
    { icon: 'today', label: "Today's Appointments", value: data?.todayAppointments || 0, gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', sub: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) },
    { icon: 'calendar_month', label: 'Monthly Appointments', value: data?.monthlyAppointments || 0, gradient: 'linear-gradient(135deg, #059669, #10b981)', sub: 'Last 30 days' },
    { icon: 'currency_rupee', label: 'Monthly Revenue', value: `₹${(data?.monthlyRevenue || 0).toLocaleString('en-IN')}`, gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', sub: 'From paid appointments' },
    { icon: 'pending', label: 'Pending Verifications', value: data?.pendingVerifications || 0, gradient: 'linear-gradient(135deg, #dc2626, #ef4444)', sub: 'Doctor profiles to review' },
  ];

  return (
    <div>
      {/* Clinic Banner */}
      <div className="card mb-4" style={{ border: 'none', background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #e0f2fe 100%)', overflow: 'hidden' }}>
        <div className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'linear-gradient(135deg, #0d9488, #14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>
                {clinic?.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h4 style={{ fontWeight: 800, margin: 0 }}>{clinic?.name || 'My Clinic'}</h4>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <span className="badge" style={{ background: `${planColors[clinic?.subscriptionPlan] || '#6b7280'}20`, color: planColors[clinic?.subscriptionPlan] || '#6b7280', fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {clinic?.subscriptionPlan || 'Free'} Plan
                  </span>
                  {clinic?.subscriptionExpiry && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Expires: {new Date(clinic.subscriptionExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card) => (
          <div className="col-6 col-lg-4 col-xl-2" key={card.label}>
            <div className="card h-100 clinic-kpi-card" style={{ border: 'none', overflow: 'hidden' }}>
              <div style={{ background: card.gradient, padding: '1.25rem' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {card.value}
                    </div>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '18px' }}>{card.icon}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>{card.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h6 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>
        <span className="material-symbols-outlined me-1" style={{ fontSize: '18px', color: '#0d9488', verticalAlign: 'middle' }}>bolt</span>
        Quick Actions
      </h6>
      <div className="row g-3">
        {[
          { to: '/clinic/doctors', icon: 'person_add', title: 'Add Doctor', desc: 'Onboard a new doctor to your clinic', color: '#0d9488', bg: '#f0fdfa' },
          { to: '/clinic/receptionists', icon: 'person_add', title: 'Add Receptionist', desc: 'Add front-desk staff for queue management', color: '#7c3aed', bg: '#f5f3ff' },
          { to: '/clinic/settings', icon: 'tune', title: 'Clinic Settings', desc: 'Update clinic profile and preferences', color: '#3b82f6', bg: '#eff6ff' },
        ].map((action) => (
          <div className="col-md-4" key={action.to}>
            <Link to={action.to} className="card p-3 h-100 text-decoration-none clinic-action-card" style={{ border: '1px solid var(--border)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ color: action.color, fontSize: '22px' }}>{action.icon}</span>
              </div>
              <h6 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-dark)', marginBottom: '0.25rem' }}>{action.title}</h6>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{action.desc}</p>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClinicDashboard;
