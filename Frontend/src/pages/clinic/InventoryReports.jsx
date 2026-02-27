import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStockLedger, getInventoryItems } from '../../services/api';

const InventoryReports = () => {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [summary, setSummary] = useState([]);

  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 30);

  const [filters, setFilters] = useState({
    from: thirtyAgo.toISOString().substring(0, 10),
    to: today.toISOString().substring(0, 10),
    itemId: '',
    type: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [page, filters]);

  const fetchItems = async () => {
    try {
      const res = await getInventoryItems({ limit: 500 });
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      if (!params.itemId) delete params.itemId;
      if (!params.type) delete params.type;

      const res = await getStockLedger(params);
      setMovements(res.data.movements || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setSummary(res.data.summary || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const typeStyles = {
    purchase: { label: 'Purchase', cls: 'bg-success' },
    consumption: { label: 'Consumption', cls: 'bg-danger' },
    adjustment: { label: 'Adjustment', cls: 'bg-warning text-dark' },
    return: { label: 'Return', cls: 'bg-info' },
  };

  const getSummaryByType = (type) => summary.find(s => s._id === type) || { totalQty: 0, totalValue: 0, count: 0 };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ fontWeight: 800 }}>Stock Ledger</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Stock movement history & reports</p>
        </div>
        <Link to="/clinic/inventory" className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px', fontWeight: 600 }}>
          ← Back to Inventory
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {['purchase', 'consumption', 'adjustment', 'return'].map(type => {
          const s = getSummaryByType(type);
          const style = typeStyles[type];
          return (
            <div className="col-6 col-md-3" key={type}>
              <div className="card p-3" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className={`badge ${style.cls}`} style={{ fontSize: '0.625rem' }}>{style.label}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{s.count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {Math.abs(s.totalQty)} units | ₹{Math.abs(s.totalValue || 0).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4" style={{ border: '1px solid var(--border)', borderRadius: '12px' }}>
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>From</label>
            <input type="date" className="form-control form-control-sm" value={filters.from} onChange={e => { setFilters(p => ({ ...p, from: e.target.value })); setPage(1); }} style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>To</label>
            <input type="date" className="form-control form-control-sm" value={filters.to} onChange={e => { setFilters(p => ({ ...p, to: e.target.value })); setPage(1); }} style={{ borderRadius: '8px' }} />
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>Item</label>
            <select className="form-select form-select-sm" value={filters.itemId} onChange={e => { setFilters(p => ({ ...p, itemId: e.target.value })); setPage(1); }} style={{ borderRadius: '8px', minWidth: '180px' }}>
              <option value="">All Items</option>
              {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }}>Type</label>
            <select className="form-select form-select-sm" value={filters.type} onChange={e => { setFilters(p => ({ ...p, type: e.target.value })); setPage(1); }} style={{ borderRadius: '8px' }}>
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="consumption">Consumption</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : movements.length === 0 ? (
        <div className="card text-center py-5" style={{ border: '1px solid var(--border)', borderRadius: '16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--text-light)' }}>receipt_long</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No movements found</h5>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting the date range or filters.</p>
        </div>
      ) : (
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Unit Cost</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>Ref</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase' }}>By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => {
                  const style = typeStyles[m.type] || {};
                  return (
                    <tr key={m._id}>
                      <td style={{ padding: '0.625rem 1rem' }}>
                        {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                          {new Date(m.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong>{m.itemId?.name || 'Unknown'}</strong>
                        {m.itemId?.sku && <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{m.itemId.sku}</div>}
                      </td>
                      <td><span className={`badge ${style.cls}`} style={{ fontSize: '0.625rem' }}>{style.label}</span></td>
                      <td>
                        <strong style={{ color: m.quantity >= 0 ? '#16a34a' : '#dc2626' }}>
                          {m.quantity >= 0 ? `+${m.quantity}` : m.quantity}
                        </strong>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}> {m.itemId?.unit}</span>
                      </td>
                      <td>₹{m.unitCost}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.reference || '-'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{m.performedBy?.name || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages} ({total} entries)</span>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryReports;
