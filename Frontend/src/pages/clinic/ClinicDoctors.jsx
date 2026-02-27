import { useState, useEffect } from 'react';
import { getClinicDoctors, addClinicDoctor, updateClinicDoctor, deleteClinicDoctor } from '../../services/api';

const ClinicDoctors = () => {
  const [doctors, setDoctors] = useState([]);
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

  const emptyForm = {
    name: '', phone: '', email: '', specialization: '',
    consultationFee: '', experience: '', qualifications: '',
    slotDuration: '15', bio: '', licenseNumber: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchDoctors(); }, [page, search]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await getClinicDoctors({ search, page, limit: 20 });
      setDoctors(res.data.doctors || []);
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

  const openEdit = (doc) => {
    const p = doc.doctorProfile;
    setEditingId(doc._id);
    setForm({
      name: doc.name || '',
      phone: doc.phone || '',
      email: doc.email || '',
      specialization: p?.specialization?.join(', ') || '',
      consultationFee: p?.consultationFee || '',
      experience: p?.experience || '',
      qualifications: p?.qualifications?.join(', ') || '',
      slotDuration: String(p?.slotDuration || 15),
      bio: p?.bio || '',
      licenseNumber: p?.licenseNumber || '',
    });
    setMsg('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        specialization: form.specialization.split(',').map(s => s.trim()).filter(Boolean),
        consultationFee: Number(form.consultationFee),
        experience: Number(form.experience) || 0,
        qualifications: form.qualifications ? form.qualifications.split(',').map(q => q.trim()) : [],
        slotDuration: Number(form.slotDuration) || 15,
        bio: form.bio,
        licenseNumber: form.licenseNumber,
      };

      if (editingId) {
        await updateClinicDoctor(editingId, payload);
        setMsg('Doctor updated successfully!');
      } else {
        await addClinicDoctor(payload);
        setMsg('Doctor added successfully!');
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClinicDoctor(id);
      setMsg('Doctor removed successfully!');
      setDeleteConfirm(null);
      fetchDoctors();
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
            <span className="material-symbols-outlined me-2" style={{ color: '#0d9488', fontSize: '28px', verticalAlign: 'middle' }}>stethoscope</span>
            Doctors ({total})
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage doctors in your clinic. Add, edit, or remove doctors.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
          Add Doctor
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
            placeholder="Search doctors by name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>person_search</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No doctors yet</h5>
          <p style={{ color: 'var(--text-muted)' }}>Add your first doctor to start managing appointments.</p>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>Add Doctor</button>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {doctors.map((doc) => {
              const profile = doc.doctorProfile;
              return (
                <div className="col-md-6 col-xl-4" key={doc._id}>
                  <div className="card h-100" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '4px', background: profile?.isApproved ? '#14b8a6' : '#f59e0b' }}></div>
                    <div className="p-3">
                      <div className="d-flex gap-3 align-items-start">
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: '#0d9488', fontSize: '22px' }}>person</span>
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <h6 style={{ fontWeight: 700, marginBottom: '0.125rem' }}>Dr. {doc.name}</h6>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>📞 {doc.phone}</div>
                          {doc.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✉️ {doc.email}</div>}
                        </div>
                        <span className="badge" style={{ background: profile?.isApproved ? '#d1fae5' : '#fef3c7', color: profile?.isApproved ? '#059669' : '#d97706', fontWeight: 600, fontSize: '0.6875rem', flexShrink: 0 }}>
                          {profile?.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      {/* Profile details */}
                      <div className="mt-3 d-flex flex-column gap-1" style={{ fontSize: '0.8125rem' }}>
                        {profile?.specialization?.length > 0 && (
                          <div className="d-flex gap-1 flex-wrap">
                            {profile.specialization.map((s, i) => (
                              <span key={i} className="badge" style={{ background: '#f0fdfa', color: '#0d9488', fontWeight: 500, fontSize: '0.6875rem' }}>{s}</span>
                            ))}
                          </div>
                        )}
                        <div className="d-flex gap-3 mt-1" style={{ color: 'var(--text-muted)' }}>
                          {profile?.experience > 0 && <span>🏅 {profile.experience} yrs</span>}
                          {profile?.consultationFee > 0 && <span>💰 ₹{profile.consultationFee}</span>}
                          {profile?.slotDuration && <span>⏱️ {profile.slotDuration} min</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-sm btn-outline-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1" onClick={() => openEdit(doc)} style={{ borderRadius: '8px', fontSize: '0.8125rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-1" onClick={() => setDeleteConfirm(doc._id)} style={{ borderRadius: '8px', fontSize: '0.8125rem' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="d-flex align-items-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-primary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Doctor Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center p-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h5 style={{ fontWeight: 700, margin: 0 }}>
                <span className="material-symbols-outlined me-2" style={{ color: '#0d9488', verticalAlign: 'middle', fontSize: '22px' }}>{editingId ? 'edit' : 'person_add'}</span>
                {editingId ? 'Edit Doctor' : 'Add Doctor'}
              </h5>
              <button onClick={() => setShowModal(false)} className="btn btn-sm" style={{ border: 'none', background: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Doctor Name *</label>
                  <input type="text" className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Dr. Full Name" />
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Phone Number *</label>
                  <input type="text" className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required maxLength={10} placeholder="10-digit number" disabled={!!editingId} style={editingId ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}} />
                  {editingId && <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Phone cannot be changed</div>}
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="doctor@email.com" />
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Specialization *</label>
                  <input type="text" className="form-control" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} required placeholder="e.g. Cardiology, Dermatology" />
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Comma-separated for multiple</div>
                </div>
                <div className="col-md-4">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Consultation Fee (₹) *</label>
                  <input type="number" className="form-control" value={form.consultationFee} onChange={e => setForm({ ...form, consultationFee: e.target.value })} required min="0" placeholder="500" />
                </div>
                <div className="col-md-4">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Experience (years)</label>
                  <input type="number" className="form-control" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} min="0" placeholder="5" />
                </div>
                <div className="col-md-4">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Slot Duration (min)</label>
                  <select className="form-select" value={form.slotDuration} onChange={e => setForm({ ...form, slotDuration: e.target.value })}>
                    <option value="10">10 min</option>
                    <option value="15">15 min</option>
                    <option value="20">20 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Qualifications</label>
                  <input type="text" className="form-control" value={form.qualifications} onChange={e => setForm({ ...form, qualifications: e.target.value })} placeholder="MBBS, MD, etc." />
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Comma-separated</div>
                </div>
                <div className="col-md-6">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>License Number</label>
                  <input type="text" className="form-control" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="MCI Reg. No." />
                </div>
                <div className="col-12">
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.375rem', display: 'block' }}>Bio</label>
                  <textarea className="form-control" rows={2} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Short professional bio..." />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {editingId ? 'Save Changes' : 'Add Doctor'}
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
            <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Remove Doctor?</h5>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              This will permanently delete the doctor and their profile from your clinic. This action cannot be undone.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>delete</span>
                Delete Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicDoctors;
