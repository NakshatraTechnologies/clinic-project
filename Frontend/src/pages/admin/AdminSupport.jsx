import { useState, useEffect } from 'react';
import { getAllSupportTickets, getSupportTicketStats, getSupportTicketById, replySupportTicket, updateSupportTicketStatus } from '../../services/api';

const STATUS_COLORS = {
  open: { bg: '#dbeafe', color: '#1d4ed8', icon: 'inbox' },
  in_progress: { bg: '#fef3c7', color: '#b45309', icon: 'hourglass_top' },
  resolved: { bg: '#d1fae5', color: '#047857', icon: 'check_circle' },
  closed: { bg: '#f3f4f6', color: '#6b7280', icon: 'lock' },
};

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', color: '#16a34a' },
  medium: { bg: '#fefce8', color: '#ca8a04' },
  high: { bg: '#fff7ed', color: '#ea580c' },
  urgent: { bg: '#fef2f2', color: '#dc2626' },
};

const AdminSupport = () => {
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getSupportTicketStats();
      setStats(res.data.stats);
    } catch (err) { console.error(err); }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;
      const res = await getAllSupportTickets(params);
      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { fetchTickets(); }, [page, statusFilter, priorityFilter, categoryFilter, search]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getSupportTicketById(id);
      setSelectedTicket(res.data.ticket);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await replySupportTicket(selectedTicket._id, { message: replyText });
      setSelectedTicket(res.data.ticket);
      setReplyText('');
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setReplying(false); }
  };

  const handleStatusChange = async (status) => {
    setStatusChanging(true);
    try {
      const res = await updateSupportTicketStatus(selectedTicket._id, status);
      setSelectedTicket(res.data.ticket);
      fetchStats();
      fetchTickets();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setStatusChanging(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const statCards = [
    { key: 'open', label: 'Open', icon: 'inbox', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
    { key: 'in_progress', label: 'In Progress', icon: 'hourglass_top', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { key: 'resolved', label: 'Resolved', icon: 'check_circle', gradient: 'linear-gradient(135deg, #10b981, #047857)' },
    { key: 'closed', label: 'Closed', icon: 'lock', gradient: 'linear-gradient(135deg, #6b7280, #4b5563)' },
  ];

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#dc2626', fontSize: '28px', verticalAlign: 'middle' }}>support_agent</span>
          Support & Tickets
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Manage all support tickets raised by clinics and patients.</p>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div className="col-6 col-md-3" key={s.key}>
            <div className="card p-3" style={{ borderRadius: '14px', border: 'none', background: s.gradient, color: '#fff', cursor: 'pointer' }}
              onClick={() => { setStatusFilter(s.key); setPage(1); }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats[s.key]}</div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, opacity: 0.9 }}>{s.label}</div>
                </div>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.4 }}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        {/* Status Tabs */}
        {statusTabs.map(tab => (
          <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }} className="btn btn-sm"
            style={{
              borderRadius: '20px', fontWeight: 600, fontSize: '0.8125rem', padding: '0.375rem 1rem',
              background: statusFilter === tab.value ? '#1e293b' : '#f0f2f4',
              color: statusFilter === tab.value ? '#fff' : 'var(--text-muted)', border: 'none',
            }}>
            {tab.label}
          </button>
        ))}
        <div style={{ borderLeft: '1px solid var(--border)', height: '24px', margin: '0 0.25rem' }}></div>
        <select className="form-select form-select-sm" value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          style={{ width: 'auto', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 600 }}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select className="form-select form-select-sm" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          style={{ width: 'auto', borderRadius: '10px', fontSize: '0.8125rem', fontWeight: 600 }}>
          <option value="">All Category</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="appointment">Appointment</option>
          <option value="complaint">Complaint</option>
          <option value="general">General</option>
        </select>
        <form onSubmit={handleSearch} className="d-flex ms-auto gap-2">
          <input type="text" className="form-control form-control-sm" placeholder="Search tickets..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
            style={{ borderRadius: '10px', fontSize: '0.8125rem', minWidth: '180px' }} />
          <button type="submit" className="btn btn-sm btn-dark" style={{ borderRadius: '10px', fontWeight: 600 }}>Search</button>
        </form>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : tickets.length === 0 ? (
        <div className="card p-5 text-center" style={{ border: '2px dashed var(--border)', borderRadius: '14px' }}>
          <span className="material-symbols-outlined mb-3" style={{ fontSize: '48px', color: 'var(--text-light)' }}>confirmation_number</span>
          <h5 style={{ fontWeight: 700 }}>No Tickets Found</h5>
          <p style={{ color: 'var(--text-muted)' }}>No support tickets match the current filters.</p>
        </div>
      ) : (
        <div className="card" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: '0.8125rem' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ fontWeight: 700, padding: '0.875rem 1rem' }}>Ticket #</th>
                  <th style={{ fontWeight: 700 }}>Subject</th>
                  <th style={{ fontWeight: 700 }}>Raised By</th>
                  <th style={{ fontWeight: 700 }}>Role</th>
                  <th style={{ fontWeight: 700 }}>Category</th>
                  <th style={{ fontWeight: 700 }}>Priority</th>
                  <th style={{ fontWeight: 700 }}>Status</th>
                  <th style={{ fontWeight: 700 }}>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => openDetail(t._id)}>
                    <td style={{ fontWeight: 700, padding: '0.875rem 1rem', color: '#dc2626' }}>{t.ticketNumber}</td>
                    <td style={{ fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                    <td>{t.raisedBy?.name || '—'}</td>
                    <td>
                      <span style={{
                        background: t.raisedByRole === 'clinic_admin' ? '#f0fdf4' : '#eff6ff',
                        color: t.raisedByRole === 'clinic_admin' ? '#047857' : '#1d4ed8',
                        padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'capitalize',
                      }}>{t.raisedByRole?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{t.category}</td>
                    <td>
                      <span style={{ ...PRIORITY_COLORS[t.priority], padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{t.priority}</span>
                    </td>
                    <td>
                      <span style={{
                        background: STATUS_COLORS[t.status]?.bg,
                        color: STATUS_COLORS[t.status]?.color,
                        padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase',
                      }}>{t.status?.replace('_', ' ')}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    <td><span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-light)' }}>chevron_right</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= pagination.pages - 3) pageNum = pagination.pages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button key={pageNum} className={`btn btn-sm ${page === pageNum ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setPage(pageNum)} style={{ borderRadius: '8px', minWidth: '36px' }}>
                  {pageNum}
                </button>
              );
            })}
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {(selectedTicket || detailLoading) && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => { setSelectedTicket(null); setReplyText(''); }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              {detailLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
              ) : selectedTicket && (
                <>
                  <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem' }}>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="modal-title mb-1" style={{ fontWeight: 800 }}>{selectedTicket.subject}</h5>
                          <div className="d-flex gap-2 align-items-center flex-wrap" style={{ fontSize: '0.8125rem' }}>
                            <span style={{ color: '#dc2626', fontWeight: 700 }}>{selectedTicket.ticketNumber}</span>
                            <span style={{ ...STATUS_COLORS[selectedTicket.status], padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{selectedTicket.status?.replace('_', ' ')}</span>
                            <span style={{ ...PRIORITY_COLORS[selectedTicket.priority], padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{selectedTicket.priority}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {selectedTicket.category}</span>
                          </div>
                        </div>
                        <button className="btn-close" onClick={() => { setSelectedTicket(null); setReplyText(''); }}></button>
                      </div>
                      {/* Raised By Info */}
                      <div className="mt-2 d-flex gap-3" style={{ fontSize: '0.8125rem' }}>
                        <span><strong>Raised by:</strong> {selectedTicket.raisedBy?.name || '—'}</span>
                        <span><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedTicket.raisedByRole?.replace('_', ' ')}</span></span>
                        {selectedTicket.clinicId && <span><strong>Clinic:</strong> {selectedTicket.clinicId.name}</span>}
                        <span><strong>Phone:</strong> {selectedTicket.raisedBy?.phone || '—'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '55vh', overflowY: 'auto' }}>
                    {/* Status Change */}
                    <div className="mb-4 p-3 d-flex align-items-center gap-3" style={{ background: '#f8f9fa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Change Status:</span>
                      <div className="d-flex gap-2 flex-wrap">
                        {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                          <button key={s} className="btn btn-sm" disabled={statusChanging || selectedTicket.status === s}
                            onClick={() => handleStatusChange(s)}
                            style={{
                              borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase',
                              background: selectedTicket.status === s ? STATUS_COLORS[s]?.color : STATUS_COLORS[s]?.bg,
                              color: selectedTicket.status === s ? '#fff' : STATUS_COLORS[s]?.color,
                              border: 'none', opacity: selectedTicket.status === s ? 1 : 0.85,
                            }}>
                            {s.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Original description */}
                    <div className="mb-4 p-3" style={{ background: '#fefce8', borderRadius: '12px', border: '1px solid #fde68a' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                          {selectedTicket.raisedBy?.name || 'User'}
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', textTransform: 'capitalize' }}>({selectedTicket.raisedByRole?.replace('_', ' ')})</span>
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(selectedTicket.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{selectedTicket.description}</p>
                    </div>

                    {/* Messages Thread */}
                    {selectedTicket.messages?.length > 0 && (
                      <div>
                        <h6 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                          <span className="material-symbols-outlined me-1" style={{ fontSize: '18px', verticalAlign: 'middle' }}>forum</span>
                          Conversation ({selectedTicket.messages.length})
                        </h6>
                        {selectedTicket.messages.map((msg, i) => (
                          <div key={i} className="mb-3 p-3" style={{
                            background: msg.senderRole === 'admin' ? '#eff6ff' : '#f0fdf4',
                            borderRadius: '12px',
                            borderLeft: `3px solid ${msg.senderRole === 'admin' ? '#3b82f6' : '#10b981'}`,
                          }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                                {msg.sender?.name || 'Unknown'}
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem', textTransform: 'capitalize' }}>({msg.senderRole?.replace('_', ' ')})</span>
                              </span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{new Date(msg.createdAt).toLocaleString('en-IN')}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Box */}
                    {selectedTicket.status !== 'closed' && (
                      <div className="mt-3">
                        <label style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Reply as Admin</label>
                        <textarea className="form-control mb-2" rows="3" placeholder="Type your response..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ borderRadius: '10px', fontSize: '0.875rem' }}></textarea>
                        <button className="btn btn-primary btn-sm" disabled={replying || !replyText.trim()} onClick={handleReply} style={{ borderRadius: '8px', fontWeight: 600 }}>
                          {replying ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
