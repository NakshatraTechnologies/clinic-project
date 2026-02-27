import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventoryItems, recordStockMovement } from '../../services/api';

const StockMovement = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    itemId: '', type: 'purchase', quantity: '', unitCost: '', reference: '', notes: '', batchNo: '',
  });
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getInventoryItems({ limit: 500 });
      setItems(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku && i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const selectItem = (item) => {
    setSelectedItem(item);
    setForm(prev => ({ ...prev, itemId: item._id, unitCost: item.purchasePrice }));
    setSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemId) return setError('Please select an item');
    if (!form.quantity || Number(form.quantity) <= 0) return setError('Quantity must be > 0');

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await recordStockMovement({
        ...form,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost) || 0,
      });
      setSuccess(res.data.message);
      setForm({ itemId: '', type: 'purchase', quantity: '', unitCost: '', reference: '', notes: '', batchNo: '' });
      setSelectedItem(null);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record movement');
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = {
    purchase: { label: '📥 Stock In (Purchase)', color: '#16a34a', desc: 'Adding stock from a vendor purchase' },
    consumption: { label: '📤 Stock Out (Usage)', color: '#dc2626', desc: 'Items used/consumed' },
    adjustment: { label: '🔄 Adjustment', color: '#d97706', desc: 'Correct stock count (positive or negative)' },
    return: { label: '↩️ Return', color: '#7c3aed', desc: 'Items returned to vendor' },
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)} style={{ borderRadius: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        </button>
        <h3 style={{ fontWeight: 800, margin: 0 }}>Stock Movement</h3>
      </div>

      <div className="row g-4">
        {/* Form */}
        <div className="col-lg-7">
          <div className="card p-4" style={{ border: '1px solid var(--border)', borderRadius: '16px' }}>
            {error && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>⚠️ {error}</div>}
            {success && <div className="alert alert-success py-2 mb-3" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>✅ {success}</div>}

            <form onSubmit={handleSubmit}>
              {/* Movement Type Selector */}
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Movement Type</label>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    className={`btn btn-sm ${form.type === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setForm(prev => ({ ...prev, type: key }))}
                    style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8125rem' }}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                {typeConfig[form.type]?.desc}
              </p>

              {/* Item Search */}
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>Select Item *</label>
              {selectedItem ? (
                <div className="d-flex align-items-center gap-2 mb-3 p-2" style={{ background: '#eff6ff', borderRadius: '10px' }}>
                  <strong>{selectedItem.name}</strong>
                  <span className="badge bg-secondary" style={{ fontSize: '0.6875rem' }}>{selectedItem.category}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Current: {selectedItem.stockQty} {selectedItem.unit}</span>
                  <button type="button" className="btn btn-sm ms-auto" onClick={() => { setSelectedItem(null); setForm(prev => ({ ...prev, itemId: '' })); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                  </button>
                </div>
              ) : (
                <div className="position-relative mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search item by name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                  {search && (
                    <div className="position-absolute w-100" style={{ top: '100%', zIndex: 10, background: 'white', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', maxHeight: '200px', overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {filteredItems.length === 0 ? (
                        <div className="p-3 text-center" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No items found</div>
                      ) : (
                        filteredItems.slice(0, 10).map(item => (
                          <button
                            key={item._id}
                            type="button"
                            className="w-100 text-start p-2 d-flex justify-content-between align-items-center"
                            style={{ border: 'none', background: 'none', borderBottom: '1px solid #f0f2f4', cursor: 'pointer', fontSize: '0.875rem' }}
                            onClick={() => selectItem(item)}
                          >
                            <span><strong>{item.name}</strong> {item.sku && <span style={{ color: 'var(--text-muted)' }}>({item.sku})</span>}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock: {item.stockQty}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Quantity *</label>
                  <input type="number" className="form-control" value={form.quantity} onChange={(e) => setForm(prev => ({ ...prev, quantity: e.target.value }))} required min="1" style={{ borderRadius: '8px' }} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Unit Cost (₹)</label>
                  <input type="number" className="form-control" value={form.unitCost} onChange={(e) => setForm(prev => ({ ...prev, unitCost: e.target.value }))} min="0" step="0.01" style={{ borderRadius: '8px' }} />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Reference / Invoice</label>
                  <input type="text" className="form-control" value={form.reference} onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))} placeholder="INV-001" style={{ borderRadius: '8px' }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Batch No.</label>
                  <input type="text" className="form-control" value={form.batchNo} onChange={(e) => setForm(prev => ({ ...prev, batchNo: e.target.value }))} style={{ borderRadius: '8px' }} />
                </div>
                <div className="col-md-6">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Notes</label>
                  <input type="text" className="form-control" value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" style={{ borderRadius: '8px' }} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-4 w-100" disabled={saving} style={{ borderRadius: '10px', fontWeight: 700 }}>
                {saving ? <span className="spinner-border spinner-border-sm"></span> : '✅ Record Movement'}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className="col-lg-5">
          <div className="card p-4" style={{ border: '1px solid var(--border)', borderRadius: '16px' }}>
            <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>
              <span className="material-symbols-outlined me-1" style={{ fontSize: '18px', verticalAlign: 'middle' }}>info</span>
              Movement Guide
            </h6>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <div key={key} className="d-flex gap-2 mb-3">
                <div style={{ width: '4px', borderRadius: '2px', background: cfg.color, flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{cfg.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cfg.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovement;
