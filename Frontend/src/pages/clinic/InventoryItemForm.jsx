import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createInventoryItem, updateInventoryItem, getInventoryItem, getVendors } from '../../services/api';

const InventoryItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', sku: '', category: 'medicine', unit: 'pcs',
    vendor: '', purchasePrice: '', sellingPrice: '',
    reorderLevel: 10, expiryDate: '', batchNo: '', description: '',
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendors();
    if (isEdit) fetchItem();
  }, [id]);

  const fetchVendors = async () => {
    try {
      const res = await getVendors();
      setVendors(res.data.vendors || []);
    } catch (err) { console.error(err); }
  };

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await getInventoryItem(id);
      const item = res.data.item;
      setForm({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || 'medicine',
        unit: item.unit || 'pcs',
        vendor: item.vendor?._id || '',
        purchasePrice: item.purchasePrice || '',
        sellingPrice: item.sellingPrice || '',
        reorderLevel: item.reorderLevel || 10,
        expiryDate: item.expiryDate ? item.expiryDate.substring(0, 10) : '',
        batchNo: item.batchNo || '',
        description: item.description || '',
      });
    } catch (err) {
      setError('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice) || 0,
        reorderLevel: Number(form.reorderLevel),
        vendor: form.vendor || undefined,
        expiryDate: form.expiryDate || undefined,
      };

      if (isEdit) {
        await updateInventoryItem(id, data);
      } else {
        await createInventoryItem(data);
      }
      navigate('/clinic/inventory');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)} style={{ borderRadius: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
        </button>
        <h3 style={{ fontWeight: 800, margin: 0 }}>{isEdit ? 'Edit Item' : 'Add New Item'}</h3>
      </div>

      <div className="card p-4" style={{ border: '1px solid var(--border)', borderRadius: '16px', maxWidth: '700px' }}>
        {error && <div className="alert alert-danger py-2 mb-3" style={{ borderRadius: '10px', fontSize: '0.875rem' }}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            {/* Name */}
            <div className="col-md-8">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Item Name *</label>
              <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required placeholder="e.g., Paracetamol 500mg" style={{ borderRadius: '8px' }} />
            </div>

            {/* SKU */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>SKU</label>
              <input type="text" className="form-control" name="sku" value={form.sku} onChange={handleChange} placeholder="e.g., MED-001" style={{ borderRadius: '8px' }} />
            </div>

            {/* Category */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Category *</label>
              <select className="form-select" name="category" value={form.category} onChange={handleChange} style={{ borderRadius: '8px' }}>
                <option value="medicine">💊 Medicine</option>
                <option value="consumable">🧴 Consumable</option>
                <option value="equipment">🔧 Equipment</option>
              </select>
            </div>

            {/* Unit */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Unit</label>
              <select className="form-select" name="unit" value={form.unit} onChange={handleChange} style={{ borderRadius: '8px' }}>
                {['pcs', 'box', 'strip', 'bottle', 'kg', 'ltr', 'pair', 'set', 'vial', 'tube'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Vendor */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Vendor</label>
              <select className="form-select" name="vendor" value={form.vendor} onChange={handleChange} style={{ borderRadius: '8px' }}>
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>

            {/* Purchase Price */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Purchase Price (₹) *</label>
              <input type="number" className="form-control" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} required min="0" step="0.01" style={{ borderRadius: '8px' }} />
            </div>

            {/* Selling Price */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Selling Price (₹)</label>
              <input type="number" className="form-control" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} min="0" step="0.01" style={{ borderRadius: '8px' }} />
            </div>

            {/* Reorder Level */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Reorder Level</label>
              <input type="number" className="form-control" name="reorderLevel" value={form.reorderLevel} onChange={handleChange} min="0" style={{ borderRadius: '8px' }} />
            </div>

            {/* Expiry */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Expiry Date</label>
              <input type="date" className="form-control" name="expiryDate" value={form.expiryDate} onChange={handleChange} style={{ borderRadius: '8px' }} />
            </div>

            {/* Batch */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Batch No.</label>
              <input type="text" className="form-control" name="batchNo" value={form.batchNo} onChange={handleChange} placeholder="e.g., B2024-001" style={{ borderRadius: '8px' }} />
            </div>

            {/* Description */}
            <div className="col-md-4">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Description</label>
              <input type="text" className="form-control" name="description" value={form.description} onChange={handleChange} placeholder="Short note..." style={{ borderRadius: '8px' }} />
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ borderRadius: '10px', fontWeight: 700 }}>
              {saving ? <span className="spinner-border spinner-border-sm"></span> : isEdit ? 'Update Item' : 'Add Item'}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)} style={{ borderRadius: '10px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryItemForm;
