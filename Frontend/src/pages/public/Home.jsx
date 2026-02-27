import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Home = () => {
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (specialty) params.set('specialty', specialty);
    if (location) params.set('location', location);
    navigate(`/doctors?${params.toString()}`);
  };

  const specialties = [
    { name: 'Dentist', icon: 'dentistry', color: '#06b6d4', bg: '#ecfeff' },
    { name: 'Cardiologist', icon: 'cardiology', color: '#ef4444', bg: '#fef2f2' },
    { name: 'Dermatologist', icon: 'dermatology', color: '#f59e0b', bg: '#fffbeb' },
    { name: 'Orthopedic', icon: 'healing', color: '#8b5cf6', bg: '#f5f3ff' },
    { name: 'Pediatrician', icon: 'child_care', color: '#ec4899', bg: '#fdf2f8' },
    { name: 'Neurologist', icon: 'psychology', color: '#3b82f6', bg: '#eff6ff' },
    { name: 'General Physician', icon: 'stethoscope', color: '#10b981', bg: '#ecfdf5' },
    { name: 'ENT Specialist', icon: 'hearing', color: '#f97316', bg: '#fff7ed' },
    { name: 'Ophthalmologist', icon: 'visibility', color: '#6366f1', bg: '#eef2ff' },
    { name: 'Gynecologist', icon: 'pregnant_woman', color: '#d946ef', bg: '#faf5ff' },
    { name: 'Psychiatrist', icon: 'self_improvement', color: '#14b8a6', bg: '#f0fdfa' },
    { name: 'Urologist', icon: 'water_drop', color: '#0ea5e9', bg: '#f0f9ff' },
  ];

  // Animated counter hook
  const useCounter = (target, duration = 2000) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const increment = target / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, [target, duration]);
    return count;
  };

  const doctorCount = useCounter(500);
  const patientCount = useCounter(15000);
  const appointmentCount = useCounter(50000);

  const testimonials = [
    { name: 'Priya Sharma', text: 'Booked my appointment in under 2 minutes! The doctor was available the same day. Amazing experience.', role: 'Patient', rating: 5 },
    { name: 'Rahul Mehta', text: 'Finally a platform that makes finding the right specialist so easy. The filters are incredibly helpful.', role: 'Patient', rating: 5 },
    { name: 'Dr. Anita Desai', text: 'As a doctor, this platform helps me manage appointments effortlessly. My patients love the online booking.', role: 'Doctor', rating: 5 },
  ];

  return (
    <>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 40%, #137fec 100%)',
        padding: '6rem 0 5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(19,127,236,0.15)', filter: 'blur(80px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', filter: 'blur(60px)' }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  background: 'rgba(19,127,236,0.2)', color: '#93c5fd', padding: '6px 16px',
                  borderRadius: '50px', fontSize: '0.8125rem', fontWeight: 600,
                  border: '1px solid rgba(147,197,253,0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                  Trusted by 15,000+ Patients
                </span>
              </div>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800,
                color: '#fff', lineHeight: 1.15, marginBottom: '1.25rem'
              }}>
                Your Health,{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>Our Priority</span>
                <br />Find & Book Doctors Instantly
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', maxWidth: '520px', marginBottom: '2rem', lineHeight: 1.7 }}>
                Search verified specialists, compare fees, read reviews, and book appointments — all in under 2 minutes.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch}>
                <div style={{
                  background: 'white', borderRadius: '16px', padding: '6px',
                  display: 'flex', alignItems: 'center', maxWidth: '580px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                  <span className="material-symbols-outlined" style={{ padding: '0 0.5rem 0 1rem', color: 'var(--text-muted)', fontSize: '22px' }}>search</span>
                  <input
                    className="search-field"
                    placeholder="Specialty (e.g. Dentist)"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '0.75rem 0.5rem', fontSize: '0.9375rem', flex: 1, outline: 'none', minWidth: 0 }}
                  />
                  <div className="d-none d-md-block" style={{ width: '1px', height: '24px', background: '#e5e7eb' }}></div>
                  <span className="material-symbols-outlined d-none d-md-block" style={{ padding: '0 0.25rem 0 0.75rem', color: 'var(--text-muted)', fontSize: '20px' }}>location_on</span>
                  <input
                    className="d-none d-md-block"
                    placeholder="City or Area"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: '0.75rem 0.5rem', fontSize: '0.9375rem', flex: 1, outline: 'none', minWidth: 0 }}
                  />
                  <button type="submit" style={{
                    background: 'linear-gradient(135deg, #137fec, #0960b6)', color: 'white', border: 'none',
                    borderRadius: '12px', padding: '0.75rem 1.75rem', fontWeight: 700, fontSize: '0.9375rem',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(19,127,236,0.4)'
                  }}>
                    Search
                  </button>
                </div>
              </form>

              {/* Quick Links */}
              <div className="d-flex flex-wrap gap-2 mt-3" style={{ maxWidth: '580px' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', fontWeight: 600, paddingTop: '4px' }}>Popular:</span>
                {['Dentist', 'Cardiologist', 'Dermatologist', 'Pediatrician'].map(s => (
                  <button key={s} onClick={() => navigate(`/doctors?specialty=${s}`)} style={{
                    background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50px', padding: '4px 14px', fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="col-lg-5 d-none d-lg-block">
              <div className="row g-3">
                {[
                  { value: `${doctorCount}+`, label: 'Verified Doctors', icon: 'stethoscope', gradient: 'linear-gradient(135deg, #137fec, #3b82f6)' },
                  { value: `${patientCount.toLocaleString('en-IN')}+`, label: 'Happy Patients', icon: 'favorite', gradient: 'linear-gradient(135deg, #ef4444, #f97316)' },
                  { value: `${appointmentCount.toLocaleString('en-IN')}+`, label: 'Appointments Booked', icon: 'calendar_month', gradient: 'linear-gradient(135deg, #10b981, #14b8a6)' },
                ].map((stat) => (
                  <div className="col-12" key={stat.label}>
                    <div style={{
                      background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
                      borderRadius: '16px', padding: '1.25rem 1.5rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{
                        width: '50px', height: '50px', borderRadius: '14px', background: stat.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '24px' }}>{stat.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{ background: '#fff', padding: '1.25rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 gap-lg-5" style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600 }}>
            {[
              { icon: 'verified_user', text: '100% Verified Doctors' },
              { icon: 'schedule', text: 'Instant Appointments' },
              { icon: 'lock', text: 'Secure & Private' },
              { icon: 'support_agent', text: '24/7 Support' },
            ].map(t => (
              <span key={t.text} className="d-flex align-items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#10b981' }}>{t.icon}</span>
                {t.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties Grid */}
      <section style={{ padding: '4.5rem 0 3.5rem' }}>
        <div className="container">
          <div className="text-center mb-4" style={{ maxWidth: '520px', margin: '0 auto 2.5rem' }}>
            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8125rem', padding: '6px 16px', marginBottom: '0.75rem' }}>SPECIALIZATIONS</span>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '0.75rem' }}>Browse by Specialty</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Find experienced doctors across every medical field</p>
          </div>
          <div className="row g-3">
            {specialties.map((spec) => (
              <div className="col-6 col-md-4 col-lg-3 col-xl-2" key={spec.name}>
                <div onClick={() => navigate(`/doctors?specialty=${spec.name}`)}
                  className="home-specialty-card"
                  style={{
                    background: '#fff', border: '1px solid var(--border)', borderRadius: '16px',
                    padding: '1.25rem 0.75rem', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{
                    width: '54px', height: '54px', borderRadius: '14px', background: spec.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.75rem', transition: 'all 0.3s'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: spec.color, fontSize: '26px' }}>{spec.icon}</span>
                  </div>
                  <h6 style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-dark)', margin: 0 }}>{spec.name}</h6>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link to="/doctors" className="btn btn-outline-primary px-4" style={{ borderRadius: '50px' }}>
              View All Specialties
              <span className="material-symbols-outlined ms-1" style={{ fontSize: '16px' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #fff 100%)', padding: '4.5rem 0' }}>
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '520px', margin: '0 auto' }}>
            <span className="badge" style={{ background: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: '0.8125rem', padding: '6px 16px', marginBottom: '0.75rem' }}>EASY BOOKING</span>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '0.75rem' }}>How It Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Book your appointment in 3 simple steps</p>
          </div>
          <div className="row g-4">
            {[
              { icon: 'person_search', title: 'Search Doctor', desc: 'Find the right specialist by name, specialty, location, or fees.', num: '01', color: '#3b82f6', bg: '#eff6ff' },
              { icon: 'calendar_month', title: 'Choose Time Slot', desc: 'Pick a convenient date and time from available slots.', num: '02', color: '#10b981', bg: '#ecfdf5' },
              { icon: 'check_circle', title: 'Book Instantly', desc: 'Confirm your appointment and get instant confirmation.', num: '03', color: '#f59e0b', bg: '#fffbeb' },
            ].map((step) => (
              <div className="col-md-4" key={step.title}>
                <div style={{
                  background: '#fff', borderRadius: '20px', padding: '2rem',
                  textAlign: 'center', border: '1px solid var(--border)',
                  transition: 'all 0.3s ease', position: 'relative', height: '100%'
                }} className="home-step-card">
                  <div style={{
                    position: 'absolute', top: '1rem', right: '1.25rem',
                    fontSize: '3rem', fontWeight: 900, color: '#f0f2f4', lineHeight: 1
                  }}>{step.num}</div>
                  <div style={{
                    width: '68px', height: '68px', borderRadius: '18px', background: step.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem'
                  }}>
                    <span className="material-symbols-outlined" style={{ color: step.color, fontSize: '30px' }}>{step.icon}</span>
                  </div>
                  <h5 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{step.title}</h5>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: 0, lineHeight: 1.6 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-5">
              <span className="badge" style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: '0.8125rem', padding: '6px 16px', marginBottom: '0.75rem' }}>WHY CHOOSE US</span>
              <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '1rem' }}>Healthcare Made Simple & Accessible</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                We connect patients with the best doctors, ensuring quality care is always within reach.
              </p>
              <Link to="/doctors" className="btn btn-primary px-4" style={{ borderRadius: '50px' }}>
                Find a Doctor Now
                <span className="material-symbols-outlined ms-1" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>
            <div className="col-lg-7">
              <div className="row g-3">
                {[
                  { icon: 'verified', title: 'Verified Doctors', desc: 'All doctors are license-verified and background-checked', color: '#137fec', bg: '#e8f2fd' },
                  { icon: 'schedule', title: 'Same-Day Booking', desc: 'Book appointments for today with real-time slot availability', color: '#10b981', bg: '#ecfdf5' },
                  { icon: 'payments', title: 'Transparent Pricing', desc: 'See consultation fees upfront — no hidden charges', color: '#f59e0b', bg: '#fffbeb' },
                  { icon: 'security', title: 'Private & Secure', desc: 'Your health data is encrypted and 100% confidential', color: '#ef4444', bg: '#fef2f2' },
                ].map((f) => (
                  <div className="col-sm-6" key={f.title}>
                    <div style={{
                      background: '#fff', borderRadius: '16px', padding: '1.5rem',
                      border: '1px solid var(--border)', height: '100%',
                      transition: 'all 0.3s'
                    }} className="home-feature-card">
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '12px', background: f.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                      }}>
                        <span className="material-symbols-outlined" style={{ color: f.color, fontSize: '24px' }}>{f.icon}</span>
                      </div>
                      <h6 style={{ fontWeight: 700, marginBottom: '0.375rem' }}>{f.title}</h6>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ background: '#f8fafc', padding: '4.5rem 0' }}>
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '520px', margin: '0 auto' }}>
            <span className="badge" style={{ background: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: '0.8125rem', padding: '6px 16px', marginBottom: '0.75rem' }}>REVIEWS</span>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '0.75rem' }}>What People Say</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Trusted by thousands of patients and doctors</p>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div className="col-md-4" key={i}>
                <div style={{
                  background: '#fff', borderRadius: '20px', padding: '2rem',
                  border: '1px solid var(--border)', height: '100%',
                  transition: 'all 0.3s'
                }} className="home-testimonial-card">
                  <div className="d-flex gap-1 mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <span key={j} className="material-symbols-outlined" style={{ fontSize: '18px', color: '#f59e0b', fontVariationSettings: '"FILL" 1' }}>star</span>
                    ))}
                  </div>
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3">
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${['#3b82f6','#10b981','#f59e0b'][i]}, ${['#60a5fa','#34d399','#fbbf24'][i]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: '1rem'
                    }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{t.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #137fec 100%)',
            borderRadius: '24px', padding: '3.5rem', color: '#fff',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(60px)' }}></div>
            <div className="row align-items-center" style={{ position: 'relative', zIndex: 2 }}>
              <div className="col-lg-8">
                <h3 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.75rem' }}>
                  Are you a healthcare provider?
                </h3>
                <p style={{ opacity: 0.8, marginBottom: '1.5rem', fontSize: '1.0625rem', maxWidth: '500px' }}>
                  Join our network of verified doctors and grow your practice. Get discovered by thousands of patients.
                </p>
                <div className="d-flex flex-wrap gap-3">
                  <Link to="/login" className="btn" style={{
                    background: 'white', color: '#137fec', fontWeight: 700, borderRadius: '12px', padding: '0.75rem 1.75rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    Register as Doctor
                  </Link>
                  <Link to="/login" className="btn" style={{
                    background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, borderRadius: '12px',
                    padding: '0.75rem 1.75rem', border: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="col-lg-4 d-none d-lg-flex justify-content-center">
                <div style={{
                  width: '140px', height: '140px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.15)'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'rgba(255,255,255,0.8)' }}>medical_services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
