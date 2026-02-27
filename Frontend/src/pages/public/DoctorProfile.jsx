import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDoctorById } from '../../services/api';
import BookingWizard from '../../components/BookingWizard';

const DoctorProfile = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const res = await getDoctorById(id);
      setDoctor(res.data.doctor);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const avatarColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  const getAvatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || avatarColors[0];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container py-5 text-center">
        <span className="material-symbols-outlined" style={{ fontSize: '72px', color: 'var(--text-light)' }}>person_off</span>
        <h4 style={{ fontWeight: 700, marginTop: '1rem' }}>Doctor not found</h4>
        <p style={{ color: 'var(--text-muted)' }}>This doctor profile doesn't exist or has been removed.</p>
        <Link to="/doctors" className="btn btn-primary">Browse All Doctors</Link>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8f9fb', minHeight: '80vh' }}>
      {/* Profile Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #137fec 0%, #0960b6 100%)', padding: '2.5rem 0 4rem', color: 'white' }}>
        <div className="container">
          <nav style={{ fontSize: '0.8125rem', marginBottom: '1.5rem', opacity: 0.8 }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <Link to="/doctors" style={{ color: 'white', textDecoration: 'none' }}>Doctors</Link>
            <span style={{ margin: '0 0.5rem' }}>/</span>
            <span style={{ fontWeight: 600 }}>Dr. {doctor.userId?.name}</span>
          </nav>

          <div className="d-flex flex-column flex-md-row gap-4 align-items-start">
            <div className="position-relative mx-auto mx-md-0" style={{ flexShrink: 0 }}>
              <div style={{
                width: '130px', height: '130px', borderRadius: '20px',
                background: getAvatarColor(doctor.userId?.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '3rem',
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}>
                {doctor.userId?.name?.charAt(0) || 'D'}
              </div>
              {doctor.isApproved && (
                <div style={{
                  position: 'absolute', bottom: '-4px', right: '-4px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#22c55e', border: '3px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'white' }}>check</span>
                </div>
              )}
            </div>
            <div className="flex-grow-1 text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
                <h2 style={{ fontWeight: 800, marginBottom: 0, fontSize: '1.75rem' }}>Dr. {doctor.userId?.name}</h2>
                {doctor.isApproved && (
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#60a5fa' }}>verified</span>
                )}
              </div>
              <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '0.75rem' }}>
                {doctor.specialization?.join(' • ') || 'General Physician'}
              </p>
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-3" style={{ fontSize: '0.875rem', opacity: 0.85 }}>
                <span className="d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>work</span>
                  {doctor.experience || '0'}+ Years Experience
                </span>
                <span className="d-flex align-items-center gap-1">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
                  {doctor.clinicAddress?.city || 'India'}
                </span>
                {doctor.rating > 0 && (
                  <span className="d-flex align-items-center gap-1">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fbbf24' }}>star</span>
                    <strong>{doctor.rating?.toFixed(1)}</strong> ({doctor.reviewCount || 0} reviews)
                  </span>
                )}
              </div>
              <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center justify-content-md-start">
                {doctor.qualifications?.map((q, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,255,255,0.15)', padding: '4px 12px',
                    borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 500
                  }}>{q}</span>
                ))}
              </div>
            </div>
            <div className="d-none d-lg-flex flex-column align-items-end" style={{ flexShrink: 0 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', padding: '1rem 1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.25rem' }}>Consultation Fee</div>
                <div style={{ fontSize: '2rem', fontWeight: 800 }}>₹{doctor.consultationFee || 500}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ marginTop: '-2rem' }}>
        <div className="row g-4">
          {/* Left Column */}
          <div className="col-lg-7">
            {/* Tabs */}
            <div className="card mb-4" style={{ border: 'none', boxShadow: 'var(--shadow)' }}>
              <div className="d-flex border-bottom overflow-auto">
                {['overview', 'qualifications', 'contact'].map((tab) => (
                  <button
                    key={tab}
                    className="px-4 py-3"
                    style={{
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontWeight: activeTab === tab ? 700 : 500,
                      color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                      borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                      fontSize: '0.875rem', textTransform: 'capitalize', whiteSpace: 'nowrap'
                    }}
                    onClick={() => setActiveTab(tab)}
                  >{tab}</button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === 'overview' && (
                  <>
                    <h5 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>person</span>
                      About Dr. {doctor.userId?.name}
                    </h5>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                      Dr. {doctor.userId?.name} is {doctor.isApproved ? 'a verified' : 'an'} {doctor.specialization?.join(' and ') || 'medical'} specialist
                      with {doctor.experience || 'several'} years of hands-on clinical experience.
                      {doctor.clinicName ? ` Currently practicing at ${doctor.clinicName}.` : ''}
                      {' '}Known for providing comprehensive care and building lasting patient relationships.
                    </p>

                    {/* Info Stats */}
                    <div className="row g-3 mb-4">
                      {[
                        { icon: 'school', title: 'Education', info: doctor.qualifications?.join(', ') || 'Not specified', bg: '#eff6ff', color: '#2563eb' },
                        { icon: 'local_hospital', title: 'Clinic', info: doctor.clinicName || 'Not specified', bg: '#f0fdf4', color: '#16a34a' },
                        { icon: 'medical_services', title: 'Specialties', info: doctor.specialization?.join(', ') || 'General', bg: '#faf5ff', color: '#7c3aed' },
                      ].map((item) => (
                        <div className="col-md-4" key={item.title}>
                          <div style={{ background: item.bg, padding: '1rem', borderRadius: '12px', height: '100%' }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <span className="material-symbols-outlined" style={{ color: item.color, fontSize: '20px' }}>{item.icon}</span>
                              <strong style={{ fontSize: '0.8125rem' }}>{item.title}</strong>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>{item.info}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Clinic Address */}
                    {doctor.clinicAddress && (
                      <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h6 className="d-flex align-items-center gap-2" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>location_on</span>
                          Clinic Location
                        </h6>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                          {[doctor.clinicAddress.street, doctor.clinicAddress.city, doctor.clinicAddress.state, doctor.clinicAddress.zipCode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'qualifications' && (
                  <>
                    <h5 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>school</span>
                      Education & Qualifications
                    </h5>
                    {doctor.qualifications?.length > 0 ? (
                      <div className="d-flex flex-column gap-3">
                        {doctor.qualifications.map((q, i) => (
                          <div key={i} className="d-flex gap-3 align-items-start" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>verified</span>
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.9375rem' }}>{q}</strong>
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0 }}>Verified Qualification</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>No qualification details available.</p>
                    )}
                  </>
                )}

                {activeTab === 'contact' && (
                  <>
                    <h5 className="d-flex align-items-center gap-2 mb-3" style={{ fontWeight: 700 }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>call</span>
                      Contact Information
                    </h5>
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex gap-3 align-items-center" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: '#16a34a', fontSize: '20px' }}>call</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Phone</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{doctor.userId?.phone || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="d-flex gap-3 align-items-center" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-outlined" style={{ color: '#2563eb', fontSize: '20px' }}>location_on</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Clinic</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{doctor.clinicName || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="card p-4" style={{ border: 'none', boxShadow: 'var(--shadow)' }}>
              <h6 style={{ fontWeight: 700, marginBottom: '1rem' }}>Why choose Dr. {doctor.userId?.name}?</h6>
              <div className="row g-3">
                {[
                  { icon: 'verified_user', title: 'Verified Doctor', desc: 'Credentials verified by NakshatraClinic team', color: '#16a34a' },
                  { icon: 'schedule', title: 'On-Time', desc: 'Known for punctual consultations', color: '#2563eb' },
                  { icon: 'thumb_up', title: 'Recommended', desc: 'Highly rated by patients', color: '#7c3aed' },
                  { icon: 'shield', title: 'Safe & Secure', desc: 'Private and confidential care', color: '#dc2626' },
                ].map((badge) => (
                  <div className="col-6" key={badge.title}>
                    <div className="d-flex gap-2 align-items-start">
                      <span className="material-symbols-outlined" style={{ color: badge.color, fontSize: '20px', marginTop: '2px' }}>{badge.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{badge.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{badge.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Wizard */}
          <div className="col-lg-5">
            <div style={{ position: 'sticky', top: '1rem' }}>
              <BookingWizard doctor={doctor} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fee bar */}
      <div className="d-lg-none" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', padding: '1rem', boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
        zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fee</div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>₹{doctor.consultationFee || 500}</div>
        </div>
        <a href="#booking" className="btn btn-primary" style={{ fontWeight: 700, borderRadius: '10px', padding: '0.625rem 1.5rem' }}>
          Book Now
        </a>
      </div>
    </div>
  );
};

export default DoctorProfile;
