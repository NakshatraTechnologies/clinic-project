import { useState, useEffect } from 'react';
import { getClinicReceptionists, addClinicReceptionist, updateClinicReceptionist, deleteClinicReceptionist } from '../../services/api';

const ClinicReceptionists = () => {
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = { name: '', phone: '', email: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchReceptionists(); }, [page, search]);

  const fetchReceptionists = async () => {
    try {
      setLoading(true);
      const res = await getClinicReceptionists({ search, page, limit: 20 });
      setReceptionists(res.data.receptionists || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMsg('');
    setShowModal(true);
  };

  const openEdit = (r) => {
    setEditingId(r._id);
    setForm({ name: r.name || '', phone: r.phone || '', email: r.email || '' });
    setMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      if (editingId) {
        await updateClinicReceptionist(editingId, { name: form.name, email: form.email });
        setMsg('Receptionist updated successfully!');
      } else {
        await addClinicReceptionist(form);
        setMsg('Receptionist added successfully!');
      }
      setShowModal(false);
      fetchReceptionists();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClinicReceptionist(id);
      setMsg('Receptionist removed successfully!');
      setDeleteConfirm(null);
      fetchReceptionists();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to delete');
      setDeleteConfirm(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#7c3aed', fontSize: '28px', verticalAlign: 'middle' }}>support_agent</span>
            Receptionists ({total})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage front-desk staff. Add, edit, or remove receptionists.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Add Receptionist
        </button>
      </div>

      {/* Alert */}
      {msg && !showModal && (
        <div className={`alert py-2 mb-3 ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ fontSize: '0.875rem' }}>
          {msg}
          <button type="button" className="btn-close float-end" style={{ fontSize: '0.625rem' }} onClick={() => setMsg('')}></button>
        </div>
      )}

      {/* Search */}
      <div className="card p-3 mb-4" style={{ border: '1px solid var(--border)' }}>
        <div className="position-relative">
          <span className="material-symbols-outlined position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '20px' }}>search</span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : receptionists.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>person_search</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No receptionists yet</h5>
          <p style={{ color: 'var(--text-muted)' }}>Add a receptionist to help manage your clinic's front desk.</p>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>Add Receptionist</button>
        </div>
      ) : (
        <>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Name', 'Phone', 'Email', 'Added By', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem 1rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receptionists.map((r) => (
                    <tr key={r._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                            {r.name?.charAt(0) || '?'}
                          </div>
                          <strong>{r.name}</strong>
                        </div>
                      </td>
                      <td>{r.phone || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.email || '—'}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {r.createdBy?.name || '—'}
                        {r.createdBy?.role && (
                          <span className="badge ms-1" style={{ background: '#f0f2f4', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.625rem' }}>
                            {r.createdBy.role.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td>
                        <span className="badge" style={{ background: r.isActive ? '#d1fae5' : '#fee2e2', color: r.isActive ? '#059669' : '#dc2626', fontWeight: 600, fontSize: '0.6875rem' }}>
                          {r.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-outline-primary d-flex align-items-center" onClick={() => openEdit(r)} style={{ borderRadius: '6px', padding: '4px 8px' }} title="Edit">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                          <button className="btn btn-sm btn-outline-danger d-flex align-items-center" onClick={() => setDeleteConfirm(r._id)} style={{ borderRadius: '6px', padding: '4px 8px' }} title="Delete">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="d-flex align-items-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-primary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Receptionist Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined me-2" style={{ color: '#7c3aed', verticalAlign: 'middle', fontSize: '22px' }}>{editingId ? 'edit' : 'person_add'}</span>
                {editingId ? 'Edit Receptionist' : 'Add Receptionist'}
              </h5>
              <button onClick={() => setShowModal(false)} className="btn btn-sm" style={{ border: 'none', background: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="d-flex flex-column gap-3">
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Full Name *</label>
                  <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Receptionist name" />
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Phone Number *</label>
                  <input type="text" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required maxLength={10} placeholder="10-digit number" disabled={!!editingId} style={editingId ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}} />
                  {editingId && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Phone cannot be changed</div>}
                </div>
                <div>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="receptionist@email.com" />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {editingId ? 'Save Changes' : 'Add Receptionist'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
              {msg && <div className={`alert mt-3 py-2 ${msg.includes('success') ? 'alert-success' : 'alert-danger'}`} style={{ fontSize: '0.875rem' }}>{msg}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '28px' }}>warning</span>
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Remove Receptionist?</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              This will permanently remove the receptionist from your clinic. They will no longer be able to log in.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicReceptionists;
