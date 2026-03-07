import { useState, useEffect } from 'react';
import {
  getPlatformSettings, updatePlatformSettings,
  createBroadcast, getBroadcasts, deleteBroadcast,
} from '../../services/api';

const TABS = [
  { key: 'platform', label: 'Platform Settings', icon: 'tune', color: '#7c3aed' },
  { key: 'broadcast', label: 'Broadcast Notifications', icon: 'campaign', color: '#dc2626' },
  { key: 'cms', label: 'CMS — Landing Page', icon: 'web', color: '#3b82f6' },
  { key: 'smtp', label: 'SMTP / SMS Config', icon: 'sms', color: '#059669' },
];

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('platform');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Broadcast state
  const [broadcasts, setBroadcasts] = useState([]);
  const [bcPage, setBcPage] = useState(1);
  const [bcPagination, setBcPagination] = useState({});
  const [bcLoading, setBcLoading] = useState(false);
  const [bcForm, setBcForm] = useState({ title: '', message: '', type: 'general' });
  const [bcSending, setBcSending] = useState(false);

  // CMS state
  const [cmsForm, setCmsForm] = useState({ heroTitle: '', heroSubtitle: '', heroDescription: '' });
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Platform form
  const [platformForm, setPlatformForm] = useState({
    platformName: '', logoUrl: '', tagline: '', timezone: '', currency: '', currencySymbol: '',
    defaultSlotDuration: 15, defaultConsultationFee: 500, contactEmail: '', contactPhone: '', address: '',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await getPlatformSettings();
      const s = res.data.settings;
      setSettings(s);
      setPlatformForm({
        platformName: s.platformName || '', logoUrl: s.logoUrl || '', tagline: s.tagline || '',
        timezone: s.timezone || '', currency: s.currency || '', currencySymbol: s.currencySymbol || '₹',
        defaultSlotDuration: s.defaultSlotDuration || 15, defaultConsultationFee: s.defaultConsultationFee || 500,
        contactEmail: s.contactEmail || '', contactPhone: s.contactPhone || '', address: s.address || '',
      });
      setCmsForm({ heroTitle: s.heroTitle || '', heroSubtitle: s.heroSubtitle || '', heroDescription: s.heroDescription || '' });
      setTestimonials(s.testimonials || []);
      setFaqs(s.faqs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchBroadcasts = async () => {
    setBcLoading(true);
    try {
      const res = await getBroadcasts({ page: bcPage, limit: 8 });
      setBroadcasts(res.data.broadcasts);
      setBcPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setBcLoading(false); }
  };

  useEffect(() => { if (activeTab === 'broadcast') fetchBroadcasts(); }, [activeTab, bcPage]);

  // ===== Platform Settings Save =====
  const savePlatform = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await updatePlatformSettings(platformForm);
      setSaveMsg('✅ Platform settings saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveMsg('❌ ' + (err.response?.data?.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  // ===== CMS Save =====
  const saveCms = async () => {
    setSaving(true); setSaveMsg('');
    try {
      await updatePlatformSettings({ ...cmsForm, testimonials, faqs });
      setSaveMsg('✅ CMS content saved!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveMsg('❌ ' + (err.response?.data?.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  // ===== Broadcast =====
  const sendBroadcast = async (e) => {
    e.preventDefault();
    if (!bcForm.title.trim() || !bcForm.message.trim()) return;
    setBcSending(true);
    try {
      await createBroadcast(bcForm);
      setBcForm({ title: '', message: '', type: 'general' });
      fetchBroadcasts();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setBcSending(false); }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!confirm('Delete this broadcast?')) return;
    try {
      await deleteBroadcast(id);
      fetchBroadcasts();
    } catch (err) { alert('Failed to delete'); }
  };

  // ===== Testimonial helpers =====
  const addTestimonial = () => setTestimonials([...testimonials, { name: '', role: '', text: '', rating: 5 }]);
  const updateTestimonial = (i, field, value) => {
    const arr = [...testimonials]; arr[i] = { ...arr[i], [field]: value }; setTestimonials(arr);
  };
  const removeTestimonial = (i) => setTestimonials(testimonials.filter((_, idx) => idx !== i));

  // ===== FAQ helpers =====
  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }]);
  const updateFaq = (i, field, value) => {
    const arr = [...faqs]; arr[i] = { ...arr[i], [field]: value }; setFaqs(arr);
  };
  const removeFaq = (i) => setFaqs(faqs.filter((_, idx) => idx !== i));

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div></div>;

  const inputStyle = { borderRadius: '10px', fontSize: '0.875rem' };
  const labelStyle = { fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' };

  const BROADCAST_TYPE_COLORS = {
    info: { bg: '#dbeafe', color: '#1d4ed8', icon: 'info' },
    warning: { bg: '#fef3c7', color: '#b45309', icon: 'warning' },
    maintenance: { bg: '#fce7f3', color: '#be185d', icon: 'build' },
    update: { bg: '#d1fae5', color: '#047857', icon: 'update' },
    general: { bg: '#f3f4f6', color: '#4b5563', icon: 'campaign' },
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 style={{ fontWeight: 800 }}>
          <span className="material-symbols-outlined me-2" style={{ color: '#7c3aed', fontSize: '28px', verticalAlign: 'middle' }}>settings</span>
          Settings & Configuration
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Master control panel for platform-wide configurations.</p>
      </div>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="btn d-flex align-items-center gap-2"
            style={{
              borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem', padding: '0.625rem 1.25rem',
              background: activeTab === tab.key ? tab.color : '#f0f2f4',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              border: 'none', transition: 'all 0.2s',
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Save Message */}
      {saveMsg && (
        <div className="alert py-2 px-3 mb-3" style={{ borderRadius: '10px', fontSize: '0.875rem', fontWeight: 600, background: saveMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2', border: 'none' }}>
          {saveMsg}
        </div>
      )}

      {/* ========== TAB: Platform Settings ========== */}
      {activeTab === 'platform' && (
        <div className="card p-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h5 className="mb-4 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
            <span className="material-symbols-outlined" style={{ color: '#7c3aed' }}>tune</span>
            Platform Configuration
          </h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>Platform Name</label>
              <input className="form-control" style={inputStyle} value={platformForm.platformName} onChange={e => setPlatformForm({ ...platformForm, platformName: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label" style={labelStyle}>Tagline</label>
              <input className="form-control" style={inputStyle} value={platformForm.tagline} onChange={e => setPlatformForm({ ...platformForm, tagline: e.target.value })} />
            </div>
            <div className="col-md-12">
              <label className="form-label" style={labelStyle}>Logo URL</label>
              <input className="form-control" style={inputStyle} placeholder="https://..." value={platformForm.logoUrl} onChange={e => setPlatformForm({ ...platformForm, logoUrl: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Timezone</label>
              <select className="form-select" style={inputStyle} value={platformForm.timezone} onChange={e => setPlatformForm({ ...platformForm, timezone: e.target.value })}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Currency</label>
              <div className="d-flex gap-2">
                <select className="form-select" style={{ ...inputStyle, flex: 2 }} value={platformForm.currency} onChange={e => setPlatformForm({ ...platformForm, currency: e.target.value })}>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
                <input className="form-control" style={{ ...inputStyle, flex: 1, maxWidth: '60px' }} value={platformForm.currencySymbol} onChange={e => setPlatformForm({ ...platformForm, currencySymbol: e.target.value })} placeholder="₹" />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Default Slot Duration (min)</label>
              <input type="number" className="form-control" style={inputStyle} value={platformForm.defaultSlotDuration} onChange={e => setPlatformForm({ ...platformForm, defaultSlotDuration: parseInt(e.target.value) || 15 })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Default Consultation Fee</label>
              <div className="input-group">
                <span className="input-group-text" style={{ borderRadius: '10px 0 0 10px', fontSize: '0.875rem' }}>{platformForm.currencySymbol}</span>
                <input type="number" className="form-control" style={{ ...inputStyle, borderRadius: '0 10px 10px 0' }} value={platformForm.defaultConsultationFee} onChange={e => setPlatformForm({ ...platformForm, defaultConsultationFee: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Contact Email</label>
              <input type="email" className="form-control" style={inputStyle} value={platformForm.contactEmail} onChange={e => setPlatformForm({ ...platformForm, contactEmail: e.target.value })} />
            </div>
            <div className="col-md-4">
              <label className="form-label" style={labelStyle}>Contact Phone</label>
              <input className="form-control" style={inputStyle} value={platformForm.contactPhone} onChange={e => setPlatformForm({ ...platformForm, contactPhone: e.target.value })} />
            </div>
            <div className="col-12">
              <label className="form-label" style={labelStyle}>Address</label>
              <textarea className="form-control" style={inputStyle} rows="2" value={platformForm.address} onChange={e => setPlatformForm({ ...platformForm, address: e.target.value })}></textarea>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-end">
            <button className="btn btn-primary d-flex align-items-center gap-2" disabled={saving} onClick={savePlatform} style={{ borderRadius: '10px', fontWeight: 600, padding: '0.625rem 1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ========== TAB: Broadcast Notifications ========== */}
      {activeTab === 'broadcast' && (
        <div>
          {/* Send New Broadcast */}
          <div className="card p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
              <span className="material-symbols-outlined" style={{ color: '#dc2626' }}>send</span>
              Send New Broadcast
            </h5>
            <form onSubmit={sendBroadcast}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label" style={labelStyle}>Title *</label>
                  <input className="form-control" style={inputStyle} placeholder="Announcement title" value={bcForm.title} onChange={e => setBcForm({ ...bcForm, title: e.target.value })} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label" style={labelStyle}>Type</label>
                  <select className="form-select" style={inputStyle} value={bcForm.type} onChange={e => setBcForm({ ...bcForm, type: e.target.value })}>
                    <option value="general">General</option>
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="update">Feature Update</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label" style={labelStyle}>Message *</label>
                  <textarea className="form-control" style={inputStyle} rows="3" placeholder="Broadcast message content..." value={bcForm.message} onChange={e => setBcForm({ ...bcForm, message: e.target.value })} required></textarea>
                </div>
              </div>
              <div className="mt-3 d-flex justify-content-end">
                <button type="submit" className="btn btn-danger d-flex align-items-center gap-2" disabled={bcSending} style={{ borderRadius: '10px', fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>campaign</span>
                  {bcSending ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>

          {/* Past Broadcasts */}
          <div className="card p-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
              <span className="material-symbols-outlined" style={{ color: '#6b7280' }}>history</span>
              Past Broadcasts
            </h5>
            {bcLoading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-4">
                <span className="material-symbols-outlined mb-2" style={{ fontSize: '40px', color: 'var(--text-light)' }}>notifications_off</span>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No broadcasts sent yet.</p>
              </div>
            ) : (
              <>
                {broadcasts.map((bc) => {
                  const typeInfo = BROADCAST_TYPE_COLORS[bc.type] || BROADCAST_TYPE_COLORS.general;
                  return (
                    <div key={bc._id} className="d-flex gap-3 p-3 mb-2 align-items-start" style={{ background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: typeInfo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ color: typeInfo.color, fontSize: '20px' }}>{typeInfo.icon}</span>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <strong style={{ fontSize: '0.9375rem' }}>{bc.title}</strong>
                            <span style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>{bc.type}</span>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(bc.createdAt).toLocaleString('en-IN')}</span>
                            <button className="btn btn-sm p-0" onClick={() => handleDeleteBroadcast(bc._id)} style={{ color: '#dc2626', border: 'none', background: 'none' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{bc.message}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {bcPagination.pages > 1 && (
                  <div className="d-flex justify-content-center gap-2 mt-3">
                    <button className="btn btn-sm btn-outline-secondary" disabled={bcPage <= 1} onClick={() => setBcPage(p => p - 1)} style={{ borderRadius: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
                    </button>
                    {Array.from({ length: bcPagination.pages }, (_, i) => (
                      <button key={i + 1} className={`btn btn-sm ${bcPage === i + 1 ? 'btn-dark' : 'btn-outline-secondary'}`} onClick={() => setBcPage(i + 1)} style={{ borderRadius: '8px', minWidth: '36px' }}>{i + 1}</button>
                    ))}
                    <button className="btn btn-sm btn-outline-secondary" disabled={bcPage >= bcPagination.pages} onClick={() => setBcPage(p => p + 1)} style={{ borderRadius: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== TAB: CMS — Landing Page ========== */}
      {activeTab === 'cms' && (
        <div>
          {/* Hero Section */}
          <div className="card p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h5 className="mb-3 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
              <span className="material-symbols-outlined" style={{ color: '#3b82f6' }}>view_carousel</span>
              Hero Section
            </h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Hero Title</label>
                <input className="form-control" style={inputStyle} value={cmsForm.heroTitle} onChange={e => setCmsForm({ ...cmsForm, heroTitle: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Hero Subtitle</label>
                <input className="form-control" style={inputStyle} value={cmsForm.heroSubtitle} onChange={e => setCmsForm({ ...cmsForm, heroSubtitle: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label" style={labelStyle}>Hero Description</label>
                <textarea className="form-control" style={inputStyle} rows="3" value={cmsForm.heroDescription} onChange={e => setCmsForm({ ...cmsForm, heroDescription: e.target.value })}></textarea>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="card p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
                <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>format_quote</span>
                Testimonials ({testimonials.length})
              </h5>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addTestimonial} style={{ borderRadius: '8px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add
              </button>
            </div>
            {testimonials.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No testimonials added yet. Click "Add" to create one.</p>
            ) : (
              testimonials.map((t, i) => (
                <div key={i} className="p-3 mb-2" style={{ background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Name</label>
                      <input className="form-control form-control-sm" style={inputStyle} value={t.name} onChange={e => updateTestimonial(i, 'name', e.target.value)} placeholder="Patient name" />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Role</label>
                      <input className="form-control form-control-sm" style={inputStyle} value={t.role} onChange={e => updateTestimonial(i, 'role', e.target.value)} placeholder="e.g. Patient" />
                    </div>
                    <div className="col-md-1">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Rating</label>
                      <select className="form-select form-select-sm" style={inputStyle} value={t.rating} onChange={e => updateTestimonial(i, 'rating', parseInt(e.target.value))}>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r}★</option>)}
                      </select>
                    </div>
                    <div className="col-md-5">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Text</label>
                      <input className="form-control form-control-sm" style={inputStyle} value={t.text} onChange={e => updateTestimonial(i, 'text', e.target.value)} placeholder="Testimonial text" />
                    </div>
                    <div className="col-md-1 text-end">
                      <button className="btn btn-sm p-1" onClick={() => removeTestimonial(i)} style={{ color: '#dc2626', border: 'none', background: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* FAQs */}
          <div className="card p-4 mb-4" style={{ borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0 d-flex align-items-center gap-2" style={{ fontWeight: 800 }}>
                <span className="material-symbols-outlined" style={{ color: '#10b981' }}>quiz</span>
                FAQs ({faqs.length})
              </h5>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addFaq} style={{ borderRadius: '8px', fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> Add
              </button>
            </div>
            {faqs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>No FAQs added yet. Click "Add" to create one.</p>
            ) : (
              faqs.map((f, i) => (
                <div key={i} className="p-3 mb-2" style={{ background: '#fafafa', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Question</label>
                      <input className="form-control form-control-sm" style={inputStyle} value={f.question} onChange={e => updateFaq(i, 'question', e.target.value)} placeholder="FAQ question" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" style={{ ...labelStyle, fontSize: '0.75rem' }}>Answer</label>
                      <input className="form-control form-control-sm" style={inputStyle} value={f.answer} onChange={e => updateFaq(i, 'answer', e.target.value)} placeholder="FAQ answer" />
                    </div>
                    <div className="col-md-1 text-end">
                      <button className="btn btn-sm p-1" onClick={() => removeFaq(i)} style={{ color: '#dc2626', border: 'none', background: 'none' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Save CMS */}
          <div className="d-flex justify-content-end">
            <button className="btn btn-primary d-flex align-items-center gap-2" disabled={saving} onClick={saveCms} style={{ borderRadius: '10px', fontWeight: 600, padding: '0.625rem 1.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>save</span>
              {saving ? 'Saving...' : 'Save CMS Content'}
            </button>
          </div>
        </div>
      )}

      {/* ========== TAB: SMTP / SMS (Coming Soon) ========== */}
      {activeTab === 'smtp' && (
        <div className="card p-5 text-center" style={{ border: '2px dashed var(--border)', background: '#fafafa', borderRadius: '16px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <span className="material-symbols-outlined" style={{ color: '#059669', fontSize: '36px' }}>sms</span>
          </div>
          <h4 style={{ fontWeight: 800 }}>SMTP & SMS Configuration</h4>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0.5rem auto 1.5rem', lineHeight: 1.6 }}>
            Configure email (SMTP) and SMS gateway API keys for transactional messages like appointment confirmations and OTP delivery.
          </p>
          <span className="badge" style={{ background: '#f0f2f4', color: 'var(--text-muted)', fontWeight: 600, padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
            🚀 Coming Soon — Requires External API Integration
          </span>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
