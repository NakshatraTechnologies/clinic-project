import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInventoryAlerts } from '../../services/api';

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState({ lowStock: [], nearExpiry: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('lowStock');

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    try {
      const res = await getInventoryAlerts();
      setAlerts(res.data.alerts || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'lowStock', label: 'Low Stock', icon: 'trending_down', color: '#d97706', count: alerts.lowStockCount || alerts.lowStock?.length || 0 },
    { key: 'nearExpiry', label: 'Expiring Soon', icon: 'timer', color: '#ea580c', count: alerts.nearExpiryCount || alerts.nearExpiry?.length || 0 },
    { key: 'expired', label: 'Expired', icon: 'dangerous', color: '#dc2626', count: alerts.expiredCount || alerts.expired?.length || 0 },
  ];

  const currentItems = alerts[tab] || [];

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ fontWeight: 800 }}>Inventory Alerts</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Items requiring attention</p>
        </div>
        <Link to="/clinic/inventory" className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px', fontWeight: 600 }}>
          ← Back to Inventory
        </Link>
      </div>

      {/* Alert Summary Cards */}
      <div className="row g-3 mb-4">
        {tabs.map(t => (
          <div className="col-md-4" key={t.key}>
            <button
              className="card w-100 p-3 text-start"
              style={{ border: tab === t.key ? `2px solid ${t.color}` : '1px solid var(--border)', borderRadius: '14px', background: tab === t.key ? `${t.color}10` : 'white', cursor: 'pointer' }}
              onClick={() => setTab(t.key)}
            >
              <div className="d-flex align-items-center gap-3">
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${t.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ color: t.color, fontSize: '24px' }}>{t.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{t.count}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{t.label}</div>
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : currentItems.length === 0 ? (
        <div className="card text-center py-5" style={{ border: '1px solid var(--border)', borderRadius: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#22c55e' }}>check_circle</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem', color: '#166534' }}>All Clear! 🎉</h5>
          <p style={{ color: 'var(--text-muted)' }}>No {tabs.find(t => t.key === tab)?.label?.toLowerCase()} alerts.</p>
        </div>
      ) : (
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', padding: '0.75rem 1rem' }}>Item</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Reorder Level</th>
                  {tab !== 'lowStock' && <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Expiry</th>}
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item._id}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong>{item.name}</strong>
                      {item.batchNo && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Batch: {item.batchNo}</div>}
                    </td>
                    <td><span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-dark)', textTransform: 'capitalize', fontSize: '0.6875rem' }}>{item.category}</span></td>
                    <td>
                      <strong style={{ color: item.stockQty <= 0 ? '#dc2626' : '#d97706' }}>{item.stockQty}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> {item.unit}</span>
                    </td>
                    <td>{item.reorderLevel}</td>
                    {tab !== 'lowStock' && (
                      <td>
                        <span style={{ color: tab === 'expired' ? '#dc2626' : '#d97706', fontWeight: 600 }}>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                    )}
                    <td>
                      <Link to="/clinic/inventory/stock" className="btn btn-sm btn-outline-primary" style={{ borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        Restock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAlerts;
