import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInventoryItems, deleteInventoryItem } from '../../services/api';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState(''); // lowStock, nearExpiry
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchItems();
  }, [page, category, filter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (search) params.search = search;
      if (category) params.category = category;
      if (filter === 'lowStock') params.lowStock = 'true';
      if (filter === 'nearExpiry') params.nearExpiry = 'true';

      const res = await getInventoryItems(params);
      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from inventory?`)) return;
    try {
      await deleteInventoryItem(id);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const getStockBadge = (item) => {
    if (item.stockQty <= 0) return { cls: 'bg-danger', label: 'Out of Stock' };
    if (item.stockQty <= item.reorderLevel) return { cls: 'bg-warning text-dark', label: 'Low Stock' };
    return { cls: 'bg-success', label: 'In Stock' };
  };

  const getCategoryIcon = (cat) => {
    const map = { medicine: '💊', consumable: '🧴', equipment: '🔧' };
    return map[cat] || '📦';
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 style={{ fontWeight: 800 }}>Inventory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} items total
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/clinic/inventory/stock" className="btn btn-outline-primary d-flex align-items-center gap-1" style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>swap_vert</span>
            Stock In/Out
          </Link>
          <Link to="/clinic/inventory/add" className="btn btn-primary d-flex align-items-center gap-1" style={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
            Add Item
          </Link>
        </div>
      </div>

      {/* Filters Row */}
      <div className="card p-3 mb-4" style={{ border: '1px solid var(--border)' }}>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <form onSubmit={handleSearch} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ borderRadius: '8px', fontSize: '0.875rem' }}
            />
            <button type="submit" className="btn btn-outline-primary btn-sm" style={{ borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
            </button>
          </form>

          <select
            className="form-select"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            style={{ width: 'auto', borderRadius: '8px', fontSize: '0.875rem' }}
          >
            <option value="">All Categories</option>
            <option value="medicine">💊 Medicine</option>
            <option value="consumable">🧴 Consumable</option>
            <option value="equipment">🔧 Equipment</option>
          </select>

          <select
            className="form-select"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            style={{ width: 'auto', borderRadius: '8px', fontSize: '0.875rem' }}
          >
            <option value="">All Status</option>
            <option value="lowStock">⚠️ Low Stock</option>
            <option value="nearExpiry">⏰ Near Expiry</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : items.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>inventory_2</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No items found</h5>
          <p style={{ color: 'var(--text-muted)' }}>Add your first inventory item to get started.</p>
          <Link to="/clinic/inventory/add" className="btn btn-primary btn-sm">Add Item</Link>
        </div>
      ) : (
        <div className="card" style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem 1rem' }}>Item</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>SKU</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Price</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Expiry</th>
                  <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const badge = getStockBadge(item);
                  return (
                    <tr key={item._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '1.25rem' }}>{getCategoryIcon(item.category)}</span>
                          <div>
                            <strong>{item.name}</strong>
                            {item.vendor?.name && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Vendor: {item.vendor.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.sku || '-'}</td>
                      <td>
                        <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-dark)', textTransform: 'capitalize', fontSize: '0.6875rem' }}>
                          {item.category}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <strong style={{ color: item.stockQty <= item.reorderLevel ? '#dc2626' : 'inherit' }}>
                            {item.stockQty}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                          <span className={`badge ${badge.cls}`} style={{ fontSize: '0.6rem' }}>{badge.label}</span>
                        </div>
                      </td>
                      <td>₹{item.purchasePrice}</td>
                      <td>
                        {item.expiryDate ? (
                          <span style={{
                            color: new Date(item.expiryDate) < new Date() ? '#dc2626' :
                              new Date(item.expiryDate) < new Date(Date.now() + 30 * 86400000) ? '#d97706' : 'var(--text-muted)',
                            fontWeight: 600, fontSize: '0.8125rem'
                          }}>
                            {new Date(item.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <Link to={`/clinic/inventory/${item._id}/edit`} className="btn btn-sm btn-outline-primary" style={{ borderRadius: '6px', padding: '2px 8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </Link>
                          <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: '6px', padding: '2px 8px' }} onClick={() => handleDelete(item._id, item.name)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Page {page} of {totalPages} ({total} items)
              </span>
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

export default InventoryList;
