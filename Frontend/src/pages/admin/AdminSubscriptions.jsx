const AdminSubscriptions = () => {
  const plans = [
    { name: 'Manage Plans', desc: 'Create & edit subscription plans with custom features, pricing tiers, and trial periods.', icon: 'credit_card', color: '#4f46e5' },
    { name: 'Invoices & Payments', desc: 'Track payment history, pending invoices, and Razorpay/Stripe integration logs.', icon: 'receipt_long', color: '#059669' },
    { name: 'Discount Coupons', desc: 'Create promo codes, set expiry dates, and track usage for marketing campaigns.', icon: 'sell', color: '#d97706' },
  ];

  return (
    <div>
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#4f46e5', fontSize: '28px', verticalAlign: 'middle' }}>payments</span>
          Subscriptions & Billing
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage plans, payments, and promotional offers.</p>
      </div>

      <div className="row g-3">
        {plans.map((plan) => (
          <div className="col-md-4" key={plan.name}>
            <div className="card h-100 text-center p-4" style={{ border: '2px dashed var(--border)', background: '#fafafa' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${plan.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <span className="material-symbols-outlined" style={{ color: plan.color, fontSize: '28px' }}>{plan.icon}</span>
              </div>
              <h5 style={{ fontWeight: 700 }}>{plan.name}</h5>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5 }}>{plan.desc}</p>
              <div className="mt-auto">
                <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-muted)', fontWeight: 600, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
                  🚀 Coming Soon
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 mt-4 text-center" style={{ border: '1px solid var(--border)', background: 'linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)' }}>
        <h5 style={{ fontWeight: 700 }}>💡 This feature needs backend APIs</h5>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
          Plan model, Invoice model, and Coupon model need to be created. Payment gateway integration (Razorpay/Stripe) will also be required.
        </p>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
