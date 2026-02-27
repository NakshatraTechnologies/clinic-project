import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctorSlots, getDoctorSlotSummary, getDoctorExceptions, bookAppointment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingWizard = ({ doctor }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState(1); // 1=date, 2=slot, 3=confirm
  const [dates, setDates] = useState([]);
  const [slotSummary, setSlotSummary] = useState({});
  const [exceptions, setExceptions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const doctorUserId = doctor?.userId?._id || doctor?.userId;

  useEffect(() => {
    if (doctorUserId) {
      fetchSummary();
      fetchExceptions();
    }
  }, [doctorUserId]);

  useEffect(() => {
    if (selectedDate && doctorUserId) fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSummary = async () => {
    try {
      const res = await getDoctorSlotSummary(doctorUserId);
      const map = {};
      (res.data.summary || []).forEach(d => { map[d.date] = d; });
      setSlotSummary(map);

      const today = new Date();
      const next14 = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        next14.push(d);
      }
      setDates(next14);
    } catch (err) {
      console.error('Failed to fetch summary', err);
    }
  };

  const fetchExceptions = async () => {
    try {
      const res = await getDoctorExceptions(doctorUserId);
      const map = {};
      (res.data.exceptions || []).forEach(e => {
        const key = new Date(e.date).toLocaleDateString('en-CA');
        map[key] = e;
      });
      setExceptions(map);
    } catch (err) {
      console.error('Failed to fetch exceptions', err);
    }
  };

  const fetchSlots = async (date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = date.toLocaleDateString('en-CA');
      const res = await getDoctorSlots(doctorUserId, dateStr);
      setSlots(res.data.availableSlots || []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBook = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!selectedSlot || !selectedDate) return;
    setBooking(true);
    setBookingError('');
    try {
      const dateStr = selectedDate.toLocaleDateString('en-CA');
      const res = await bookAppointment({
        doctorId: doctorUserId,
        date: dateStr,
        startTime: selectedSlot.startTime,
        notes,
      });
      // Navigate to confirmation page
      navigate(`/booking-confirmation/${res.data.appointment._id}`, {
        state: { appointment: res.data.appointment, doctor }
      });
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const getDayName = (d) => d.toLocaleDateString('en-IN', { weekday: 'short' });
  const getDateNum = (d) => d.getDate();

  // Group slots by time of day
  const morningSlots = slots.filter(s => parseInt(s.startTime.split(':')[0]) < 12);
  const afternoonSlots = slots.filter(s => { const h = parseInt(s.startTime.split(':')[0]); return h >= 12 && h < 17; });
  const eveningSlots = slots.filter(s => parseInt(s.startTime.split(':')[0]) >= 17);

  const stepLabels = ['Select Date', 'Choose Time', 'Confirm'];

  return (
    <div className="booking-wizard">
      {/* Booking Header */}
      <div style={{ background: 'linear-gradient(135deg, #137fec 0%, #0960b6 100%)', color: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px 16px 0 0' }}>
        <h5 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined">calendar_month</span>
          Book Appointment
        </h5>
        <p style={{ fontSize: '0.8125rem', margin: 0, opacity: 0.85 }}>3-step quick booking</p>
      </div>

      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '0 0 16px 16px', border: '1px solid var(--border)', borderTop: 'none' }}>
        {/* Step Indicator */}
        <div className="d-flex justify-content-between mb-4" style={{ position: 'relative' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', top: '16px', left: '16%', right: '16%', height: '2px', background: '#e5e7eb', zIndex: 0 }}></div>
          <div style={{ position: 'absolute', top: '16px', left: '16%', width: `${Math.max(0, (step - 1) * 34)}%`, height: '2px', background: 'var(--primary)', zIndex: 1, transition: 'width 0.3s ease' }}></div>
          {stepLabels.map((label, i) => (
            <div key={i} className="text-center" style={{ zIndex: 2, flex: 1 }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.75rem',
                background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'var(--primary)' : '#e5e7eb',
                color: step >= i + 1 ? 'white' : 'var(--text-muted)',
                transition: 'all 0.3s ease'
              }}>
                {step > i + 1 ? <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span> : i + 1}
              </div>
              <div style={{ fontSize: '0.6875rem', fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ===== STEP 1: Date Selection ===== */}
        {step === 1 && (
          <div>
            <label style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.75rem', display: 'block', color: 'var(--text-dark)' }}>
              📅 Pick a Date
            </label>
            <div className="date-strip">
              {dates.map((d, i) => {
                const dateKey = d.toLocaleDateString('en-CA');
                const daySummary = slotSummary[dateKey];
                const exception = exceptions[dateKey];
                const isSelected = selectedDate?.toDateString() === d.toDateString();
                const isToday = d.toDateString() === new Date().toDateString();
                const isHoliday = exception && (exception.type === 'holiday' || exception.type === 'leave');
                const slotsLeft = daySummary?.availableSlots || 0;
                const isAvailable = daySummary?.isAvailable && !isHoliday;

                return (
                  <button
                    key={i}
                    className={`date-btn ${isSelected ? 'active' : ''} ${isAvailable ? 'available' : 'unavailable'}`}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                        setBookingError('');
                        setStep(2);
                      }
                    }}
                    disabled={!isAvailable}
                    style={{ border: isSelected ? 'none' : undefined, position: 'relative', opacity: isAvailable ? 1 : 0.5 }}
                  >
                    <span className="day-name">{getDayName(d)}</span>
                    <span className="day-num">{getDateNum(d)}</span>
                    {isHoliday ? (
                      <span style={{ fontSize: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                        {exception.type === 'holiday' ? '🏖️ Holiday' : '🚫 Leave'}
                      </span>
                    ) : slotsLeft > 0 ? (
                      <span style={{ fontSize: '0.55rem', color: isSelected ? 'white' : '#16a34a', fontWeight: 600 }}>
                        {slotsLeft} slots
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                        {daySummary?.isAvailable === false ? 'Off' : '-'}
                      </span>
                    )}
                    {isToday && (
                      <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', fontSize: '7px', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>TODAY</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== STEP 2: Time Slot Selection ===== */}
        {step === 2 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-dark)', marginBottom: 0 }}>
                  🕐 Pick a Time
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedDate?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setStep(1); setSelectedSlot(null); }} style={{ borderRadius: '8px', fontSize: '0.75rem' }}>
                ← Change Date
              </button>
            </div>

            {slotsLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary"></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.5rem' }}>Loading slots...</div>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-4" style={{ background: '#f9fafb', borderRadius: '12px' }}>
                <span className="material-symbols-outlined d-block mb-2" style={{ fontSize: '40px', color: 'var(--text-light)' }}>event_busy</span>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No slots available</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Please pick another date</div>
                <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => setStep(1)}>← Back to dates</button>
              </div>
            ) : (
              <>
                {[
                  { label: '🌅 Morning', slots: morningSlots },
                  { label: '☀️ Afternoon', slots: afternoonSlots },
                  { label: '🌇 Evening', slots: eveningSlots },
                ].map((group) => group.slots.length > 0 && (
                  <div className="mb-3" key={group.label}>
                    <h6 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-light)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {group.label} ({group.slots.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {group.slots.map((slot) => {
                        const isSelected = selectedSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            className={`time-slot-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => { setSelectedSlot(slot); setBookingError(''); }}
                          >
                            {slot.startTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {selectedSlot && (
                  <button
                    className="btn btn-primary w-100 mt-2"
                    onClick={() => setStep(3)}
                    style={{ borderRadius: '10px', fontWeight: 700 }}
                  >
                    Continue to Confirm →
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== STEP 3: Confirm & Book ===== */}
        {step === 3 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <label style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-dark)', marginBottom: 0 }}>
                📋 Confirm Details
              </label>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setStep(2)} style={{ borderRadius: '8px', fontSize: '0.75rem' }}>
                ← Change Time
              </button>
            </div>

            {/* Summary Card */}
            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                Appointment Summary
              </div>
              {[
                { label: 'Doctor', value: `Dr. ${doctor?.userId?.name || 'Unknown'}` },
                { label: 'Specialty', value: doctor?.specialization?.join(', ') || 'General' },
                { label: 'Date', value: selectedDate?.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) },
                { label: 'Time', value: selectedSlot?.startTime },
                { label: 'Clinic', value: doctor?.clinicName || 'N/A' },
              ].map((row) => (
                <div key={row.label} className="d-flex justify-content-between py-1" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span>{row.label}</span>
                  <strong style={{ color: 'var(--text-dark)' }}>{row.value}</strong>
                </div>
              ))}
              <hr style={{ margin: '0.5rem 0' }} />
              <div className="d-flex justify-content-between">
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Consultation Fee</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.125rem' }}>₹{doctor?.consultationFee || 500}</strong>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-3">
              <label style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.375rem', display: 'block' }}>
                📝 Reason for visit (optional)
              </label>
              <textarea
                className="form-control"
                rows={2}
                placeholder="e.g., Fever and cold for 3 days..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ fontSize: '0.875rem', resize: 'none', borderRadius: '10px' }}
              />
            </div>

            {/* Error */}
            {bookingError && (
              <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '0.8125rem', borderRadius: '10px' }}>
                ⚠️ {bookingError}
              </div>
            )}

            {/* Book Button */}
            <button
              className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              onClick={handleBook}
              disabled={booking}
              style={{
                borderRadius: '10px', fontWeight: 700, fontSize: '1rem',
                background: 'linear-gradient(135deg, #137fec 0%, #0960b6 100%)',
              }}
            >
              {booking ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event_available</span>
              )}
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>

            {!isAuthenticated && (
              <p className="text-center mt-2" style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                ⚠️ You'll need to <a href="/login" style={{ fontWeight: 700 }}>login</a> before booking
              </p>
            )}
            <p className="text-center mt-2" style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              🔒 No payment required until visit • Free cancellation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingWizard;
