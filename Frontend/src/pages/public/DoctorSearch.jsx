import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchDoctors } from '../../services/api';
import DoctorCardSkeleton from '../../components/DoctorCardSkeleton';

const DoctorSearch = () => {
  const [searchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('specialty') || '');
  const [filters, setFilters] = useState({
    specialty: searchParams.get('specialty') || '',
    experience: '',
    fee: '',
    sort: 'name', // name, fee-low, fee-high, experience
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await searchDoctors();
      setDoctors(res.data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    if (search) {
      const s = search.toLowerCase();
      const name = (doc.userId?.name || '').toLowerCase();
      const specs = (doc.specialization || []).map(x => x.toLowerCase());
      const clinicName = (doc.clinicName || '').toLowerCase();
      if (!name.includes(s) && !specs.some(sp => sp.includes(s)) && !clinicName.includes(s)) return false;
    }
    if (filters.specialty) {
      const specs = doc.specialization || [];
      if (!specs.some(sp => sp.toLowerCase().includes(filters.specialty.toLowerCase()))) return false;
    }
    if (filters.experience) {
      const exp = parseInt(doc.experience) || 0;
      if (filters.experience === '5+' && exp < 5) return false;
      if (filters.experience === '10+' && exp < 10) return false;
      if (filters.experience === '15+' && exp < 15) return false;
    }
    if (filters.fee) {
      const fee = doc.consultationFee || 500;
      if (filters.fee === 'low' && fee > 500) return false;
      if (filters.fee === 'mid' && (fee < 500 || fee > 1000)) return false;
      if (filters.fee === 'high' && fee < 1000) return false;
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'fee-low': return (a.consultationFee || 500) - (b.consultationFee || 500);
      case 'fee-high': return (b.consultationFee || 500) - (a.consultationFee || 500);
      case 'experience': return (b.experience || 0) - (a.experience || 0);
      default: return (a.userId?.name || '').localeCompare(b.userId?.name || '');
    }
  });

  const allSpecialties = [...new Set(doctors.flatMap(d => d.specialization || []))];
  const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488'];
  const getAvatarColor = (name) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
  const activeFilterCount = [filters.specialty, filters.experience, filters.fee].filter(Boolean).length;

  const resetFilters = () => {
    setSearch('');
    setFilters({ specialty: '', experience: '', fee: '', sort: 'name' });
  };

  /* Shared filter sidebar content */
  const FilterContent = () => (
    <>
      {/* Specialty */}
      <div className="mb-4">
        <h6 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-dark)' }}>
          <span className="material-symbols-outlined me-1" style={{ fontSize: '15px', verticalAlign: 'middle' }}>category</span>
          Specialty
        </h6>
        <div className="d-flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${!filters.specialty ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setFilters({ ...filters, specialty: '' })}
            style={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 14px' }}
          >All</button>
          {allSpecialties.map(sp => (
            <button
              key={sp}
              className={`btn btn-sm ${filters.specialty === sp ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilters({ ...filters, specialty: filters.specialty === sp ? '' : sp })}
              style={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 14px' }}
            >{sp}</button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <h6 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-dark)' }}>
          <span className="material-symbols-outlined me-1" style={{ fontSize: '15px', verticalAlign: 'middle' }}>military_tech</span>
          Experience
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {[
            { value: '', label: 'Any' },
            { value: '5+', label: '5+ Yrs' },
            { value: '10+', label: '10+ Yrs' },
            { value: '15+', label: '15+ Yrs' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`btn btn-sm ${filters.experience === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilters({ ...filters, experience: opt.value })}
              style={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 14px' }}
            >{opt.label}</button>
          ))}
        </div>
      </div>

      {/* Fee */}
      <div className="mb-3">
        <h6 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-dark)' }}>
          <span className="material-symbols-outlined me-1" style={{ fontSize: '15px', verticalAlign: 'middle' }}>payments</span>
          Consultation Fee
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {[
            { value: '', label: 'Any' },
            { value: 'low', label: 'Under ₹500' },
            { value: 'mid', label: '₹500–₹1000' },
            { value: 'high', label: '₹1000+' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`btn btn-sm ${filters.fee === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setFilters({ ...filters, fee: opt.value })}
              style={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 14px' }}
            >{opt.label}</button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div style={{ background: '#f8f9fb', minHeight: '80vh' }}>
      {/* Hero Search Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #137fec 100%)', padding: '2.5rem 0 2rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blur */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: '-80px', right: '-40px' }}></div>
        <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: '-60px', left: '10%' }}></div>

        <div className="container" style={{ position: 'relative' }}>
          <nav style={{ fontSize: '0.8125rem', marginBottom: '1rem', opacity: 0.7 }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <span style={{ fontWeight: 600 }}>Find Doctors</span>
          </nav>
          <h2 style={{ fontWeight: 800, marginBottom: '0.375rem', fontSize: '1.75rem' }}>
            <span className="material-symbols-outlined me-2" style={{ fontSize: '28px', verticalAlign: 'middle' }}>search</span>
            Find Your Doctor
          </h2>
          <p style={{ opacity: 0.8, marginBottom: '1.25rem', fontSize: '0.9375rem' }}>Search from {doctors.length} verified specialists — book instantly</p>

          {/* Search Bar */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '6px 6px 6px 0',
            display: 'flex', alignItems: 'center', maxWidth: '640px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <span className="material-symbols-outlined" style={{ padding: '0 0.75rem 0 1rem', color: '#9ca3af', fontSize: '22px' }}>search</span>
            <input
              type="text"
              placeholder="Doctor name, specialty, or clinic..."
              style={{
                border: 'none', outline: 'none', flex: 1, fontSize: '0.9375rem',
                fontWeight: 500, padding: '0.625rem 0', color: '#111418', background: 'transparent'
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', color: '#9ca3af', padding: '0 0.75rem', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            )}
            <button className="btn btn-primary" style={{ borderRadius: '10px', fontWeight: 700, padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
              Search
            </button>
          </div>

          {/* Quick Specialty Chips */}
          {allSpecialties.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-3">
              {allSpecialties.slice(0, 8).map(sp => (
                <button
                  key={sp}
                  className="btn btn-sm"
                  onClick={() => { setFilters({ ...filters, specialty: filters.specialty === sp ? '' : sp }); }}
                  style={{
                    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 14px',
                    background: filters.specialty === sp ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.2s'
                  }}
                >{sp}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          {/* Desktop Filters Sidebar */}
          <div className="col-lg-3 d-none d-lg-block">
            <div className="card p-4" style={{ border: 'none', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', position: 'sticky', top: '5rem', borderRadius: '16px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 style={{ fontWeight: 800, margin: 0, fontSize: '1rem' }}>
                  <span className="material-symbols-outlined me-1" style={{ fontSize: '18px', verticalAlign: 'middle' }}>tune</span>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="badge ms-2" style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.625rem', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
                  )}
                </h5>
                {activeFilterCount > 0 && (
                  <button className="btn btn-sm" style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem' }} onClick={resetFilters}>
                    <span className="material-symbols-outlined me-1" style={{ fontSize: '14px' }}>restart_alt</span>
                    Reset
                  </button>
                )}
              </div>
              <FilterContent />
            </div>
          </div>

          {/* Doctor Results */}
          <div className="col-lg-9">
            {/* Results Header + Sort + Mobile Filter Toggle */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div>
                <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.125rem' }}>
                  {loading ? 'Searching...' : `${filteredDoctors.length} Doctor${filteredDoctors.length !== 1 ? 's' : ''} Found`}
                </h4>
                {(search || filters.specialty) && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                    {search && `Results for "${search}"`}
                    {filters.specialty && ` in ${filters.specialty}`}
                  </p>
                )}
              </div>
              <div className="d-flex gap-2 align-items-center">
                {/* Sort Dropdown */}
                <select
                  className="form-select form-select-sm"
                  value={filters.sort}
                  onChange={e => setFilters({ ...filters, sort: e.target.value })}
                  style={{ width: 'auto', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '8px', minWidth: '140px' }}
                >
                  <option value="name">Sort: Name A-Z</option>
                  <option value="fee-low">Sort: Fee Low→High</option>
                  <option value="fee-high">Sort: Fee High→Low</option>
                  <option value="experience">Sort: Experience</option>
                </select>

                {/* Mobile Filter Button */}
                <button
                  className="btn btn-outline-primary btn-sm d-lg-none d-flex align-items-center gap-1"
                  onClick={() => setShowMobileFilters(true)}
                  style={{ borderRadius: '8px', fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>tune</span>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="badge bg-primary" style={{ fontSize: '0.625rem', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>{activeFilterCount}</span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
              <div className="d-flex flex-wrap gap-2 mb-3">
                {filters.specialty && (
                  <span className="badge d-flex align-items-center gap-1" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem', borderRadius: '20px', padding: '5px 12px' }}>
                    {filters.specialty}
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', cursor: 'pointer' }} onClick={() => setFilters({ ...filters, specialty: '' })}>close</span>
                  </span>
                )}
                {filters.experience && (
                  <span className="badge d-flex align-items-center gap-1" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '0.75rem', borderRadius: '20px', padding: '5px 12px' }}>
                    {filters.experience} Years
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', cursor: 'pointer' }} onClick={() => setFilters({ ...filters, experience: '' })}>close</span>
                  </span>
                )}
                {filters.fee && (
                  <span className="badge d-flex align-items-center gap-1" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.75rem', borderRadius: '20px', padding: '5px 12px' }}>
                    {filters.fee === 'low' ? 'Under ₹500' : filters.fee === 'mid' ? '₹500–₹1000' : '₹1000+'}
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', cursor: 'pointer' }} onClick={() => setFilters({ ...filters, fee: '' })}>close</span>
                  </span>
                )}
                <button className="btn btn-sm" onClick={resetFilters} style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', padding: '2px 8px' }}>
                  Clear all
                </button>
              </div>
            )}

            {/* Doctor List */}
            {loading ? (
              <DoctorCardSkeleton />
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-5">
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#f0f2f4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--text-light)' }}>search_off</span>
                </div>
                <h5 style={{ fontWeight: 700 }}>No doctors found</h5>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1rem', fontSize: '0.9375rem' }}>
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button onClick={resetFilters} className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontWeight: 600 }}>
                  <span className="material-symbols-outlined me-1" style={{ fontSize: '16px' }}>restart_alt</span>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="card"
                    style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.25s', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(19,127,236,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div className="d-flex flex-column flex-md-row">
                      {/* Doctor Info */}
                      <div className="p-3 p-md-4 flex-grow-1">
                        <div className="d-flex gap-3">
                          {/* Avatar */}
                          <div style={{
                            width: '60px', height: '60px', borderRadius: '14px',
                            background: `linear-gradient(135deg, ${getAvatarColor(doc.userId?.name)}, ${getAvatarColor(doc.userId?.name)}dd)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: '1.25rem', flexShrink: 0,
                            boxShadow: `0 4px 12px ${getAvatarColor(doc.userId?.name)}40`
                          }}>
                            {doc.userId?.name?.charAt(0) || 'D'}
                          </div>

                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            {/* Name + Verified */}
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <h6 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>Dr. {doc.userId?.name || 'Unknown'}</h6>
                              {doc.isApproved && <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#60a5fa' }}>verified</span>}
                            </div>

                            {/* Specialization */}
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              {(doc.specialization || ['General Physician']).map((sp, i) => (
                                <span key={i} style={{
                                  background: '#eff6ff', color: '#1e40af', padding: '2px 10px', borderRadius: '12px',
                                  fontSize: '0.6875rem', fontWeight: 600
                                }}>{sp}</span>
                              ))}
                            </div>

                            {/* Info Row */}
                            <div className="d-flex flex-wrap gap-3" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                              {doc.experience > 0 && (
                                <span className="d-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#f59e0b' }}>military_tech</span>
                                  {doc.experience} Yrs
                                </span>
                              )}
                              {doc.clinicAddress?.city && (
                                <span className="d-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#ef4444' }}>location_on</span>
                                  {doc.clinicAddress.city}
                                </span>
                              )}
                              {doc.qualifications?.length > 0 && (
                                <span className="d-flex align-items-center gap-1">
                                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#8b5cf6' }}>school</span>
                                  {doc.qualifications.slice(0, 2).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right — Fee & Actions */}
                      <div className="d-flex flex-row flex-md-column align-items-center justify-content-between p-3 p-md-4 gap-2" style={{
                        borderTop: '1px solid #f0f2f4', borderLeft: 'none', background: '#fafbfc', minWidth: '180px'
                      }}>
                        <style>{`@media(min-width:768px){.doc-right-panel{border-top:none !important;border-left:1px solid #f0f2f4 !important;}}`}</style>
                        <div className="doc-right-panel text-center text-md-center" style={{ borderTop: 'inherit', borderLeft: 'inherit' }}>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fee</div>
                          <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.2 }}>₹{doc.consultationFee || 500}</div>
                        </div>
                        <div className="d-flex flex-column gap-2 w-100" style={{ maxWidth: '160px' }}>
                          <Link
                            to={`/doctors/${doc._id}`}
                            className="btn btn-primary d-flex align-items-center justify-content-center gap-1"
                            style={{ fontWeight: 700, borderRadius: '10px', fontSize: '0.8125rem', padding: '0.5rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                            Book Now
                          </Link>
                          <Link
                            to={`/doctors/${doc._id}`}
                            className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-1"
                            style={{ fontWeight: 600, borderRadius: '10px', fontSize: '0.75rem', padding: '0.375rem' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowMobileFilters(false)}>
          <div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflow: 'auto', padding: '1.5rem', boxShadow: '0 -10px 40px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ fontWeight: 800, margin: 0 }}>
                <span className="material-symbols-outlined me-1" style={{ fontSize: '20px', verticalAlign: 'middle' }}>tune</span>
                Filters
              </h5>
              <button className="btn btn-sm" onClick={() => setShowMobileFilters(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>✕</button>
            </div>
            <FilterContent />
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary flex-grow-1" onClick={() => setShowMobileFilters(false)} style={{ borderRadius: '10px', fontWeight: 700 }}>
                Show {filteredDoctors.length} Results
              </button>
              {activeFilterCount > 0 && (
                <button className="btn btn-outline-danger" onClick={resetFilters} style={{ borderRadius: '10px', fontWeight: 600 }}>Reset</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
