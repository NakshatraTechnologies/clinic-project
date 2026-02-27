import { useLocation, useNavigate, Link } from 'react-router-dom';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointment, doctor } = location.state || {};

  if (!appointment) {
    return (
      <div className="container py-5 text-center">
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--text-light)' }}>info</span>
        <h4 style={{ fontWeight: 700, marginTop: '1rem' }}>No booking details found</h4>
        <p style={{ color: 'var(--text-muted)' }}>Please try booking again.</p>
        <Link to="/doctors" className="btn btn-primary">Find a Doctor</Link>
      </div>
    );
  }

  const appointmentDate = new Date(appointment.date);
  const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Generate calendar link (Google Calendar)
  const calendarTitle = encodeURIComponent(`Doctor Appointment - Dr. ${appointment.doctorId?.name || doctor?.userId?.name || 'Doctor'}`);
  const calendarDetails = encodeURIComponent(`Appointment at ${doctor?.clinicName || 'Clinic'}. ${appointment.notes || ''}`);
  const dateStr = appointmentDate.toISOString().split('T')[0].replace(/-/g, '');
  const startH = appointment.startTime.replace(':', '');
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calendarTitle}&dates=${dateStr}T${startH}00/${dateStr}T${startH}00&details=${calendarDetails}`;

  return (
    <div style={{ background: '#f8f9fb', minHeight: '80vh' }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            {/* Success Hero */}
            <div className="text-center mb-4">
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
                animation: 'pulse 2s infinite'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'white' }}>check_circle</span>
              </div>
              <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', color: '#166534' }}>Booking Confirmed! 🎉</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                Your appointment has been successfully booked.
              </p>
            </div>

            {/* Appointment Card */}
            <div className="card mb-4" style={{ border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: '16px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg, #137fec, #0960b6)', padding: '1rem 1.5rem', color: 'white' }}>
                <div className="d-flex align-items-center gap-2">
                  <span className="material-symbols-outlined">event_available</span>
                  <strong>Appointment Details</strong>
                </div>
              </div>
              <div className="p-4">
                <div className="d-flex gap-3 mb-3">
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '14px',
                    background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>person</span>
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 700, margin: 0 }}>Dr. {appointment.doctorId?.name || doctor?.userId?.name || 'Doctor'}</h5>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {doctor?.specialization?.join(', ') || 'Specialist'}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
                  {[
                    { icon: 'calendar_month', label: 'Date', value: formattedDate },
                    { icon: 'schedule', label: 'Time', value: appointment.startTime },
                    { icon: 'location_on', label: 'Clinic', value: doctor?.clinicName || 'N/A' },
                    { icon: 'payments', label: 'Fee', value: `₹${appointment.amount || doctor?.consultationFee || 500}` },
                    { icon: 'badge', label: 'Status', value: appointment.status?.toUpperCase() || 'CONFIRMED' },
                  ].map((item) => (
                    <div key={item.label} className="d-flex align-items-center gap-3 py-2" style={{ borderBottom: '1px solid #f0f2f4' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', minWidth: '60px' }}>{item.label}</span>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>{item.value}</strong>
                    </div>
                  ))}
                </div>

                {appointment.notes && (
                  <div className="mt-3 p-2" style={{ background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>📝 Your Note:</span>
                    <span style={{ fontSize: '0.8125rem', color: '#78350f', marginLeft: '0.5rem' }}>{appointment.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex flex-column gap-2">
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '10px', fontWeight: 600 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_add_on</span>
                Add to Google Calendar
              </a>
              <Link
                to="/dashboard/appointments"
                className="btn btn-primary d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '10px', fontWeight: 700 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list_alt</span>
                View My Appointments
              </Link>
              <Link
                to="/doctors"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '10px', fontWeight: 600 }}
              >
                Book Another Appointment
              </Link>
            </div>

            {/* Note */}
            <div className="text-center mt-4" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle' }}>info</span>
              {' '}You can cancel or reschedule from your dashboard.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default BookingConfirmation;
