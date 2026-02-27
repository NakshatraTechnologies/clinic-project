import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard } from '../../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getAdminDashboard();
      setData(res.data.dashboard);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
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

  const kpiCards = [
    {
      icon: 'local_hospital',
      label: 'Total Clinics',
      value: data?.clinics?.total || 0,
      sub: `${data?.clinics?.active || 0} Active · ${(data?.clinics?.total || 0) - (data?.clinics?.active || 0)} Inactive`,
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      bg: '#ede9fe',
    },
    {
      icon: 'stethoscope',
      label: 'Doctors Onboarded',
      value: data?.users?.totalDoctors || 0,
      sub: `${data?.subscriptions?.pendingVerifications || 0} pending verification`,
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)',
      bg: '#cffafe',
    },
    {
      icon: 'currency_rupee',
      label: 'Platform Revenue',
      value: `₹${(data?.revenue?.total || 0).toLocaleString('en-IN')}`,
      sub: `${data?.appointments?.thisMonth || 0} appointments this month`,
      gradient: 'linear-gradient(135deg, #059669, #10b981)',
      bg: '#d1fae5',
    },
    {
      icon: 'group',
      label: 'Total Patients',
      value: data?.users?.totalPatients || 0,
      sub: `${data?.users?.newPatientsThisMonth || 0} new this month`,
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      bg: '#fef3c7',
    },
    {
      icon: 'trending_up',
      label: 'This Month Growth',
      value: `+${data?.clinics?.newThisMonth || 0}`,
      sub: `New clinics · ${data?.users?.newDoctorsThisMonth || 0} new doctors`,
      gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
      bg: '#fee2e2',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ fontSize: '28px', color: '#f59e0b', verticalAlign: 'middle' }}>shield_person</span>
            Platform Overview
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Bird's eye view of your SaaS platform — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {kpiCards.map((card) => (
          <div className="col-6 col-xl" key={card.label}>
            <div className="card h-100 admin-kpi-card" style={{ border: 'none', overflow: 'hidden' }}>
              <div style={{ background: card.gradient, padding: '1.25rem' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                      {card.value}
                    </div>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '22px' }}>{card.icon}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.75rem' }}>
                  {card.sub}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Grid */}
      <div className="row g-3 mb-4">
        {/* Users Breakdown */}
        <div className="col-md-6 col-lg-4">
          <div className="card p-4 h-100" style={{ border: '1px solid var(--border)' }}>
            <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: '20px' }}>groups</span>
              Users Breakdown
            </h6>
            {[
              { label: 'Patients', value: data?.users?.totalPatients || 0, color: '#3b82f6' },
              { label: 'Doctors', value: data?.users?.totalDoctors || 0, color: '#10b981' },
              { label: 'Clinic Admins', value: data?.users?.totalClinicAdmins || 0, color: '#f59e0b' },
              { label: 'Receptionists', value: data?.users?.totalReceptionists || 0, color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label} className="d-flex justify-content-between align-items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="d-flex align-items-center gap-2">
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }}></div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
                <strong style={{ fontSize: '0.9375rem' }}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Subscriptions */}
        <div className="col-md-6 col-lg-4">
          <div className="card p-4 h-100" style={{ border: '1px solid var(--border)' }}>
            <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '20px' }}>credit_card</span>
              Subscriptions
            </h6>
            <div className="d-flex flex-column gap-3">
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Active Paid Plans</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{data?.subscriptions?.active || 0}</div>
              </div>
              <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Expiring in 7 Days</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{data?.subscriptions?.expiringSoon || 0}</div>
              </div>
              <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Pending Verifications</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{data?.subscriptions?.pendingVerifications || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments */}
        <div className="col-md-12 col-lg-4">
          <div className="card p-4 h-100" style={{ border: '1px solid var(--border)' }}>
            <h6 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '20px' }}>calendar_month</span>
              Appointments
            </h6>
            <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Total All-Time</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb' }}>{data?.appointments?.total || 0}</div>
            </div>
            <div style={{ background: '#f0f2f4', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>This Month</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)' }}>{data?.appointments?.thisMonth || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row g-3">
        {[
          { to: '/admin/clinics', icon: 'local_hospital', title: 'Manage Clinics', desc: 'Create, edit, block/suspend clinics', color: '#4f46e5', bg: '#ede9fe' },
          { to: '/admin/doctors', icon: 'verified', title: 'Doctor Verification', desc: 'Approve pending doctor requests', color: '#059669', bg: '#d1fae5' },
          { to: '/admin/users', icon: 'manage_accounts', title: 'User Management', desc: 'View, search, and manage all users', color: '#d97706', bg: '#fef3c7' },
          { to: '/admin/subscriptions', icon: 'payments', title: 'Billing & Plans', desc: 'Manage subscription plans & invoices', color: '#dc2626', bg: '#fee2e2' },
        ].map((action) => (
          <div className="col-6 col-lg-3" key={action.to}>
            <Link to={action.to} className="card p-3 h-100 text-decoration-none admin-action-card" style={{ border: '1px solid var(--border)' }}>
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

export default AdminDashboard;
