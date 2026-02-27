import { useState, useEffect } from 'react';
import { getAdminDoctors, adminVerifyDoctor } from '../../services/api';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchDoctors(); }, [page, search, status]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await getAdminDoctors({ search, status, page, limit: 15 });
      setDoctors(res.data.doctors || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId, isApproved) => {
    try {
      await adminVerifyDoctor(doctorId, isApproved);
      fetchDoctors();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const tabs = [
    { key: '', label: 'All Doctors', icon: 'groups' },
    { key: 'pending', label: 'Pending Verification', icon: 'pending' },
    { key: 'approved', label: 'Approved', icon: 'verified' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#059669', fontSize: '28px', verticalAlign: 'middle' }}>stethoscope</span>
            Doctors & Verification
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} doctors registered across all clinics. Review pending verification requests.
          </p>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="card p-3 mb-4" style={{ border: '1px solid var(--border)' }}>
        <div className="d-flex flex-wrap gap-3 align-items-center">
          <div className="position-relative flex-grow-1">
            <span className="material-symbols-outlined position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)', fontSize: '20px' }}>search</span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            className="px-3 py-2 d-flex align-items-center gap-1"
            style={{
              border: 'none',
              background: 'none',
              fontWeight: status === t.key ? 700 : 500,
              color: status === t.key ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: status === t.key ? '2px solid var(--primary)' : '2px solid transparent',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
            onClick={() => { setStatus(t.key); setPage(1); }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>person_search</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No doctors found</h5>
          <p style={{ color: 'var(--text-muted)' }}>
            {status === 'pending' ? 'No pending verification requests.' : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <>
          <div className="row g-3">
            {doctors.map((doc) => {
              const profile = doc.doctorProfile;
              const isApproved = profile?.isApproved;
              return (
                <div className="col-md-6 col-xl-4" key={doc._id}>
                  <div className="card h-100" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {/* Status Banner */}
                    <div style={{ height: '4px', background: isApproved ? '#10b981' : '#f59e0b' }}></div>
                    <div className="p-3">
                      <div className="d-flex gap-3 align-items-start">
                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: isApproved ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ color: isApproved ? '#059669' : '#d97706', fontSize: '24px' }}>
                            {isApproved ? 'verified_user' : 'pending'}
                          </span>
                        </div>
                        <div className="flex-grow-1" style={{ minWidth: 0 }}>
                          <h6 style={{ fontWeight: 700, marginBottom: '0.125rem' }}>Dr. {doc.name}</h6>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>📞 {doc.phone}</div>
                          {doc.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✉️ {doc.email}</div>}
                        </div>
                        <span className="badge" style={{ background: isApproved ? '#d1fae5' : '#fef3c7', color: isApproved ? '#059669' : '#d97706', fontWeight: 600, fontSize: '0.6875rem', flexShrink: 0 }}>
                          {isApproved ? 'Verified' : 'Pending'}
                        </span>
                      </div>

                      {/* Profile Details */}
                      <div className="mt-3 d-flex flex-column gap-1" style={{ fontSize: '0.8125rem' }}>
                        {profile?.specialization?.length > 0 && (
                          <div className="d-flex gap-1 flex-wrap">
                            {profile.specialization.map((s, i) => (
                              <span key={i} className="badge" style={{ background: '#ede9fe', color: '#7c3aed', fontWeight: 500, fontSize: '0.6875rem' }}>{s}</span>
                            ))}
                          </div>
                        )}
                        <div className="d-flex gap-3 mt-1" style={{ color: 'var(--text-muted)' }}>
                          {profile?.experience && <span>🏅 {profile.experience} yrs exp</span>}
                          {profile?.consultationFee && <span>💰 ₹{profile.consultationFee}</span>}
                        </div>
                        {doc.clinicId?.name && (
                          <div style={{ color: 'var(--text-muted)' }}>
                            🏥 {doc.clinicId.name}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="d-flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        {!isApproved ? (
                          <button className="btn btn-sm btn-success d-flex align-items-center gap-1 flex-grow-1 justify-content-center" onClick={() => handleVerify(doc._id, true)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                            Approve
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 flex-grow-1 justify-content-center" onClick={() => handleVerify(doc._id, false)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cancel</span>
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-4">
              <button className="btn btn-sm btn-outline-primary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <span className="d-flex align-items-center" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button className="btn btn-sm btn-outline-primary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDoctors;
