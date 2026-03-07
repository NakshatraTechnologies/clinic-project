import { useState, useEffect } from 'react';
import { createSupportTicket, getMySupportTickets, getSupportTicketById, replySupportTicket } from '../../services/api';

const STATUS_COLORS = {
  open: { bg: '#dbeafe', color: '#1d4ed8' },
  in_progress: { bg: '#fef3c7', color: '#b45309' },
  resolved: { bg: '#d1fae5', color: '#047857' },
  closed: { bg: '#f3f4f6', color: '#6b7280' },
};

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', color: '#16a34a' },
  medium: { bg: '#fefce8', color: '#ca8a04' },
  high: { bg: '#fff7ed', color: '#ea580c' },
  urgent: { bg: '#fef2f2', color: '#dc2626' },
};

const PatientSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'complaint', priority: 'medium', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 8 };
      if (statusFilter) params.status = statusFilter;
      const res = await getMySupportTickets(params);
      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, [page, statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      await createSupportTicket(form);
      setShowCreate(false);
      setForm({ subject: '', category: 'complaint', priority: 'medium', description: '' });
      setPage(1);
      fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await getSupportTicketById(id);
      setSelectedTicket(res.data.ticket);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await replySupportTicket(selectedTicket._id, { message: replyText });
      setSelectedTicket(res.data.ticket);
      setReplyText('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

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
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
        <div>
          <h3 style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined me-2" style={{ color: 'var(--primary)', fontSize: '28px', verticalAlign: 'middle' }}>support_agent</span>
            Support & Complaints
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Raise complaints and track their resolution status.</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setShowCreate(true)} style={{ fontWeight: 600, borderRadius: '10px', padding: '0.625rem 1.25rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          Raise Complaint
        </button>
      </div>

      {/* Status Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {statusTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className="btn btn-sm"
            style={{
              borderRadius: '20px', fontWeight: 600, fontSize: '0.8125rem',
              padding: '0.375rem 1rem',
              background: statusFilter === tab.value ? 'var(--primary)' : '#f0f2f4',
              color: statusFilter === tab.value ? '#fff' : 'var(--text-muted)',
              border: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : tickets.length === 0 ? (
        <div className="card p-5 text-center" style={{ border: '2px dashed var(--border)', borderRadius: '16px' }}>
          <span className="material-symbols-outlined mb-3" style={{ fontSize: '48px', color: 'var(--text-light)' }}>inbox</span>
          <h5 style={{ fontWeight: 700 }}>No Complaints Found</h5>
          <p style={{ color: 'var(--text-muted)' }}>You haven't raised any complaints yet.</p>
        </div>
      ) : (
        <div className="row g-3">
          {tickets.map(t => (
            <div key={t._id} className="col-12" onClick={() => openDetail(t._id)} style={{ cursor: 'pointer' }}>
              <div className="card p-3" style={{ borderRadius: '14px', border: '1px solid var(--border)', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.8125rem' }}>{t.ticketNumber}</span>
                      <span style={{ ...STATUS_COLORS[t.status], padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{t.status?.replace('_', ' ')}</span>
                      <span style={{ ...PRIORITY_COLORS[t.priority], padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{t.priority}</span>
                    </div>
                    <h6 style={{ fontWeight: 700, margin: '0.25rem 0', fontSize: '0.9375rem' }}>{t.subject}</h6>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>{t.description}</p>
                  </div>
                  <div className="text-end" style={{ minWidth: '100px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                    <span className="material-symbols-outlined mt-1" style={{ fontSize: '20px', color: 'var(--text-light)' }}>chevron_right</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-4">
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button key={i + 1} className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setPage(i + 1)} style={{ borderRadius: '8px', minWidth: '36px' }}>
              {i + 1}
            </button>
          ))}
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      )}

      {/* Create Complaint Modal */}
      {showCreate && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => setShowCreate(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem' }}>
                <h5 className="modal-title" style={{ fontWeight: 800 }}>
                  <span className="material-symbols-outlined me-2" style={{ verticalAlign: 'middle', color: 'var(--primary)' }}>report</span>
                  Raise a Complaint
                </h5>
                <button className="btn-close" onClick={() => setShowCreate(false)}></button>
              </div>
              <form onSubmit={handleCreate}>
                <div className="modal-body" style={{ padding: '1.5rem' }}>
                  <div className="mb-3">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Subject *</label>
                    <input type="text" className="form-control" placeholder="What's the issue?" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required style={{ borderRadius: '10px' }} />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Category</label>
                      <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ borderRadius: '10px' }}>
                        <option value="complaint">Complaint</option>
                        <option value="appointment">Appointment Issue</option>
                        <option value="billing">Billing</option>
                        <option value="technical">Technical</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Priority</label>
                      <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ borderRadius: '10px' }}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-0">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Description *</label>
                    <textarea className="form-control" rows="4" placeholder="Please describe your complaint in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ borderRadius: '10px' }}></textarea>
                  </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
                  <button type="button" className="btn btn-light" onClick={() => setShowCreate(false)} style={{ borderRadius: '10px', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating} style={{ borderRadius: '10px', fontWeight: 600 }}>
                    {creating ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {(selectedTicket || detailLoading) && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }} onClick={() => { setSelectedTicket(null); fetchTickets(); }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              {detailLoading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
              ) : selectedTicket && (
                <>
                  <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '1.25rem 1.5rem' }}>
                    <div>
                      <h5 className="modal-title mb-1" style={{ fontWeight: 800 }}>{selectedTicket.subject}</h5>
                      <div className="d-flex gap-2 align-items-center" style={{ fontSize: '0.8125rem' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{selectedTicket.ticketNumber}</span>
                        <span style={{ ...STATUS_COLORS[selectedTicket.status], padding: '0.125rem 0.5rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.6875rem', textTransform: 'uppercase' }}>{selectedTicket.status?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <button className="btn-close" onClick={() => { setSelectedTicket(null); fetchTickets(); }}></button>
                  </div>
                  <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    {/* Original description */}
                    <div className="mb-4 p-3" style={{ background: '#f8f9fa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>You</span>
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
                                {msg.senderRole === 'admin' ? 'Support Team' : 'You'}
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
                        <textarea className="form-control mb-2" rows="3" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ borderRadius: '10px', fontSize: '0.875rem' }}></textarea>
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

export default PatientSupport;
