import { useState, useEffect } from 'react';
import { getAdminUsers, adminToggleUser } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchUsers(); }, [page, search, role]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = { search, page, limit: 20 };
      if (role) params.role = role;
      const res = await getAdminUsers(params);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (userId) => {
    try {
      await adminToggleUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const roleBadge = (r) => {
    const map = {
      patient: { bg: '#dbeafe', color: '#2563eb', icon: 'person', label: 'Patient' },
      doctor: { bg: '#d1fae5', color: '#059669', icon: 'stethoscope', label: 'Doctor' },
      admin: { bg: '#fee2e2', color: '#dc2626', icon: 'shield_person', label: 'Admin' },
      clinic_admin: { bg: '#fef3c7', color: '#d97706', icon: 'admin_panel_settings', label: 'Clinic Admin' },
      receptionist: { bg: '#ede9fe', color: '#7c3aed', icon: 'support_agent', label: 'Receptionist' },
    };
    const b = map[r] || { bg: '#f0f2f4', color: '#6b7280', icon: 'person', label: r };
    return (
      <span className="badge d-flex align-items-center gap-1" style={{ background: b.bg, color: b.color, fontWeight: 600, fontSize: '0.6875rem', width: 'fit-content' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{b.icon}</span>
        {b.label}
      </span>
    );
  };

  const roles = [
    { key: '', label: 'All Roles' },
    { key: 'patient', label: 'Patients' },
    { key: 'doctor', label: 'Doctors' },
    { key: 'clinic_admin', label: 'Clinic Admins' },
    { key: 'receptionist', label: 'Receptionists' },
    { key: 'admin', label: 'Admins' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: '#d97706', fontSize: '28px', verticalAlign: 'middle' }}>manage_accounts</span>
            User Management
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            {total} total users on the platform. Search, filter, and manage access.
          </p>
        </div>
      </div>

      {/* Filters */}
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
          <select className="form-select" style={{ width: '180px' }} value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            {roles.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="spinner-wrapper py-5"><div className="spinner-border text-primary"></div></div>
      ) : users.length === 0 ? (
        <div className="text-center py-5">
          <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>group_off</span>
          <h5 style={{ fontWeight: 700, marginTop: '1rem' }}>No users found</h5>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ border: '1px solid var(--border)' }}>
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['User', 'Phone', 'Email', 'Role', 'Clinic', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{
                            width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem', flexShrink: 0, color: '#fff',
                            background: u.role === 'admin' ? '#dc2626' : u.role === 'doctor' ? '#059669' : u.role === 'clinic_admin' ? '#d97706' : u.role === 'receptionist' ? '#7c3aed' : '#3b82f6',
                          }}>
                            {u.name?.charAt(0) || '?'}
                          </div>
                          <strong>{u.name}</strong>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{u.phone || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{u.email || '—'}</td>
                      <td style={{ verticalAlign: 'middle' }}>{roleBadge(u.role)}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', verticalAlign: 'middle' }}>{u.clinicId?.name || '—'}</td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className="badge" style={{ background: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#059669' : '#dc2626', fontWeight: 600, fontSize: '0.6875rem' }}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{ border: `1px solid ${u.isActive ? '#fecaca' : '#bbf7d0'}`, color: u.isActive ? '#dc2626' : '#16a34a', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                            onClick={() => handleToggle(u._id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{u.isActive ? 'person_off' : 'person'}</span>
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
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
    </div>
  );
};

export default AdminUsers;
