import { useState, useEffect } from 'react';
import { getVendors, createVendor, updateVendor, deleteVendor } from '../../services/api';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', gstin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    try {
      const res = await getVendors();
      setVendors(res.data.vendors || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditVendor(null);
    setForm({ name: '', phone: '', email: '', address: '', gstin: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditVendor(v);
    setForm({ name: v.name, phone: v.phone || '', email: v.email || '', address: v.address || '', gstin: v.gstin || '' });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editVendor) {
        await updateVendor(editVendor._id, form);
      } else {
        await createVendor(form);
      }
      setShowModal(false);
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete vendor "${name}"?`)) return;
    try {
      await deleteVendor(id);
      fetchVendors();
    } catch (err) { alert('Failed to delete'); }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ fontWeight: 800 }}>Vendors</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{vendors.length} suppliers</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-1" onClick={openAdd} style={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.875rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Add Vendor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>store</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No vendors yet</h5>
          <button className="btn btn-primary btn-sm mt-2" onClick={openAdd}>Add First Vendor</button>
        </div>
      ) : (
        <div className="row g-3">
          {vendors.map(v => (
            <div className="col-md-6 col-lg-4" key={v._id}>
              <div className="card h-100 p-3" style={{ border: '1px solid var(--border)', borderRadius: '14px' }}>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex gap-2 align-items-center">
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ color: '#7c3aed', fontSize: '20px' }}>store</span>
                    </div>
                    <h6 style={{ fontWeight: 700, margin: 0 }}>{v.name}</h6>
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm" onClick={() => openEdit(v)} style={{ padding: '2px 6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>edit</span>
                    </button>
                    <button className="btn btn-sm" onClick={() => handleDelete(v._id, v.name)} style={{ padding: '2px 6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#dc2626' }}>delete</span>
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {v.phone && <div className="d-flex align-items-center gap-1 mb-1"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span>{v.phone}</div>}
                  {v.email && <div className="d-flex align-items-center gap-1 mb-1"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span>{v.email}</div>}
                  {v.address && <div className="d-flex align-items-center gap-1 mb-1"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>{v.address}</div>}
                  {v.gstin && <div className="d-flex align-items-center gap-1"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>receipt</span>GSTIN: {v.gstin}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title" style={{ fontWeight: 700 }}>{editVendor ? 'Edit Vendor' : 'Add Vendor'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2" style={{ fontSize: '0.875rem', borderRadius: '8px' }}>⚠️ {error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Name *</label>
                    <input type="text" className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required style={{ borderRadius: '8px' }} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Phone</label>
                      <input type="text" className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ borderRadius: '8px' }} />
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Email</label>
                      <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Address</label>
                    <input type="text" className="form-control" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ borderRadius: '8px' }} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>GSTIN</label>
                    <input type="text" className="form-control" value={form.gstin} onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))} placeholder="e.g., 22AAAAA0000A1Z5" style={{ borderRadius: '8px' }} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={saving} style={{ borderRadius: '10px', fontWeight: 700 }}>
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : editVendor ? 'Update' : 'Add Vendor'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorList;
