import { useState, useEffect } from 'react';
import { getAdminClinics, adminCreateClinic, adminUpdateClinic, adminToggleClinic } from '../../services/api';

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
    <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
      <div className="d-flex justify-content-between align-items-center p-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h5 style={{ fontWeight: 700, margin: 0 }}>{title}</h5>
        <button type="button" onClick={onClose} className="btn btn-sm" style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>✕</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

const ClinicForm = ({ form, setForm, onSubmit, isEdit, saving, msg }) => (
  <form onSubmit={onSubmit}>
    <div className="row g-3">
      <div className="col-12">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Clinic Name *</label>
        <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      {!isEdit && (
        <>
          <div className="col-md-6">
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Admin Name *</label>
            <input type="text" className="form-control" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} required />
          </div>
          <div className="col-md-6">
            <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Admin Phone *</label>
            <input type="text" className="form-control" value={form.adminPhone} onChange={e => setForm({ ...form, adminPhone: e.target.value })} required maxLength={10} placeholder="10-digit number" />
          </div>
        </>
      )}
      <div className="col-md-6">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Email</label>
        <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="col-md-6">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Phone</label>
        <input type="text" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="col-12">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Street Address</label>
        <input type="text" className="form-control" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} />
      </div>
      <div className="col-md-4">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>City</label>
        <input type="text" className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
      </div>
      <div className="col-md-4">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>State</label>
        <input type="text" className="form-control" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
      </div>
      <div className="col-md-4">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Pincode</label>
        <input type="text" className="form-control" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} maxLength={6} />
      </div>
      <div className="col-md-6">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Subscription Plan</label>
        <select className="form-select" value={form.subscriptionPlan} onChange={e => setForm({ ...form, subscriptionPlan: e.target.value })}>
          <option value="free">Free</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>
      <div className="col-12">
        <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Description</label>
        <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
    </div>
    <div className="d-flex gap-2 mt-4">
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
        {isEdit ? 'Update Clinic' : 'Create Clinic'}
      </button>
    </div>
    {msg && <div className={`alert mt-3 py-2 ${msg.includes('success') || msg.includes('updated') ? 'alert-success' : 'alert-danger'}`} style={{ fontSize: '0.875rem' }}>{msg}</div>}
  </form>
);

const AdminClinics = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDetail, setShowDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const emptyForm = { name: '', adminName: '', adminPhone: '', email: '', phone: '', street: '', city: '', state: '', pincode: '', subscriptionPlan: 'free', description: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchClinics(); }, [page, search]);

  const fetchClinics = async () => {
    try {
      setLoading(true);
      const res = await getAdminClinics({ search, page, limit: 15 });
      setClinics(res.data.clinics || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await adminCreateClinic({
        clinicName: form.name,
        adminName: form.adminName,
        adminPhone: form.adminPhone,
        email: form.email,
        phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        subscriptionPlan: form.subscriptionPlan,
        description: form.description,
      });
      setMsg('Clinic created successfully!');
      setShowCreate(false);
      setForm(emptyForm);
      fetchClinics();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create clinic');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await adminUpdateClinic(showEdit._id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
        subscriptionPlan: form.subscriptionPlan,
        description: form.description,
      });
      setMsg('Clinic updated!');
      setShowEdit(null);
      fetchClinics();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminToggleClinic(id);
      fetchClinics();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const openEdit = (clinic) => {
    setForm({
      name: clinic.name || '',
      adminName: '',
      adminPhone: '',
      email: clinic.email || '',
      phone: clinic.phone || '',
      street: clinic.address?.street || '',
      city: clinic.address?.city || '',
      state: clinic.address?.state || '',
      pincode: clinic.address?.pincode || '',
      subscriptionPlan: clinic.subscriptionPlan || 'free',
      description: clinic.description || '',
    });
    setShowEdit(clinic);
  };

  const planBadge = (plan) => {
    const map = {
      free: { bg: '#f0f2f4', color: '#6b7280', label: 'Free' },
      professional: { bg: '#dbeafe', color: '#2563eb', label: 'Professional' },
      enterprise: { bg: '#fef3c7', color: '#d97706', label: 'Enterprise' },
    };
    const p = map[plan] || map.free;
    return <span className="badge" style={{ background: p.bg, color: p.color, fontWeight: 600, fontSize: '0.75rem' }}>{p.label}</span>;
  };

  const statusBadge = (isActive) => (
    <span className="badge" style={{ background: isActive ? '#d1fae5' : '#fee2e2', color: isActive ? '#059669' : '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}>
      {isActive ? 'Active' : 'Suspended'}
    </span>
  );



  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#4f46e5', fontSize: '28px', verticalAlign: 'middle' }}>local_hospital</span>
            Clinic Management
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Create, manage, and control all clinics on the platform.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { setForm(emptyForm); setMsg(''); setShowCreate(true); }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Clinic
        </button>
      </div>

      {/* Search */}
      <div className="card p-3 mb-4" style={{ border: '1px solid var(--border)' }}>
        <div className="d-flex gap-3 align-items-center">
          <div className="position-relative flex-grow-1">
            <span className="material-symbols-outlined position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by clinic name, city, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>
      ) : clinics.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>domain_disabled</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No clinics found</h5>
          <p style={{ color: 'var(--text-muted)' }}>Create your first clinic to get started.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem 1rem' }}>Clinic</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>City</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Plan</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</th>
                    <th style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.map((clinic) => (
                    <tr key={clinic._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0 }}>
                            {clinic.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{clinic.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{clinic.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{clinic.ownerId?.name || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{clinic.phone || '—'}</div>
                      </td>
                      <td>{clinic.address?.city || '—'}</td>
                      <td>{planBadge(clinic.subscriptionPlan)}</td>
                      <td>{statusBadge(clinic.isActive)}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        {clinic.createdAt ? new Date(clinic.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm" style={{ border: '1px solid var(--border)', padding: '0.25rem 0.5rem' }} onClick={() => setShowDetail(clinic)} title="View Details">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                          </button>
                          <button className="btn btn-sm" style={{ border: '1px solid var(--border)', padding: '0.25rem 0.5rem' }} onClick={() => { setMsg(''); openEdit(clinic); }} title="Edit">
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ border: `1px solid ${clinic.isActive ? '#fecaca' : '#bbf7d0'}`, padding: '0.25rem 0.5rem', color: clinic.isActive ? '#dc2626' : '#16a34a' }}
                            onClick={() => handleToggle(clinic._id)}
                            title={clinic.isActive ? 'Suspend' : 'Activate'}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{clinic.isActive ? 'block' : 'check_circle'}</span>
                          </button>
                          <button className="btn btn-sm" style={{ border: '1px solid #fde68a', padding: '0.25rem 0.5rem', color: '#d97706', opacity: 0.5, cursor: 'not-allowed' }} title="Login as Clinic — Coming Soon" disabled>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>login</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="d-flex align-items-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-primary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="🏥 Create New Clinic" onClose={() => setShowCreate(false)}>
          <ClinicForm form={form} setForm={setForm} onSubmit={handleCreate} isEdit={false} saving={saving} msg={msg} />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title="✏️ Edit Clinic" onClose={() => setShowEdit(null)}>
          <ClinicForm form={form} setForm={setForm} onSubmit={handleEdit} isEdit={true} saving={saving} msg={msg} />
        </Modal>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <Modal title="Clinic Details" onClose={() => setShowDetail(null)}>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>
                {showDetail.name?.charAt(0)}
              </div>
              <div>
                <h5 style={{ fontWeight: 800, margin: 0 }}>{showDetail.name}</h5>
                <div className="d-flex gap-2 mt-1">{planBadge(showDetail.subscriptionPlan)} {statusBadge(showDetail.isActive)}</div>
              </div>
            </div>
            <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border)' }} />
            {[
              { icon: 'person', label: 'Owner', value: showDetail.ownerId?.name || '—' },
              { icon: 'call', label: 'Phone', value: showDetail.phone || '—' },
              { icon: 'mail', label: 'Email', value: showDetail.email || '—' },
              { icon: 'location_on', label: 'Address', value: [showDetail.address?.street, showDetail.address?.city, showDetail.address?.state, showDetail.address?.pincode].filter(Boolean).join(', ') || '—' },
              { icon: 'info', label: 'Description', value: showDetail.description || '—' },
              { icon: 'event', label: 'Created', value: showDetail.createdAt ? new Date(showDetail.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—' },
              { icon: 'credit_card', label: 'Subscription Expiry', value: showDetail.subscriptionExpiry ? new Date(showDetail.subscriptionExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No expiry set' },
            ].map(row => (
              <div key={row.label} className="d-flex gap-3 align-items-start">
                <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px', marginTop: '2px' }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminClinics;
