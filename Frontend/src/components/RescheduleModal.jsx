import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge, Alert, Spinner } from 'react-bootstrap';
import { getDoctorSlots, getDoctorSlotSummary, rescheduleAppointment } from '../services/api';

const RescheduleModal = ({ show, onHide, appointment, onSuccess }) => {
  const [step, setStep] = useState(1); // 1=date, 2=slot
  const [summary, setSummary] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show && appointment) {
      setStep(1);
      setSelectedDate('');
      setSelectedSlot('');
      setError('');
      fetchSummary();
    }
  }, [show, appointment]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getDoctorSlotSummary(appointment.doctorId._id || appointment.doctorId);
      setSummary(res.data.summary || []);
    } catch (err) {
      setError('Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    try {
      setLoading(true);
      const doctorId = appointment.doctorId._id || appointment.doctorId;
      const res = await getDoctorSlots(doctorId, date);
      setSlots(res.data.availableSlots || []);
      setStep(2);
    } catch (err) {
      setError('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedSlot) return;
    try {
      setSubmitting(true);
      setError('');
      const res = await rescheduleAppointment(appointment._id, {
        date: selectedDate,
        startTime: selectedSlot,
      });
      onSuccess(res.data);
      onHide();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setSubmitting(false);
    }
  };

  const maxReschedules = 2;
  const remaining = maxReschedules - (appointment?.rescheduleCount || 0);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Reschedule Appointment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

        {/* Info */}
        <div className="mb-3">
          <small className="text-muted">
            Current: <strong>{appointment?.date && new Date(appointment.date).toLocaleDateString('en-IN')}</strong> at <strong>{appointment?.startTime}</strong>
          </small>
          <br />
          <small>
            Reschedules remaining: <Badge bg={remaining > 0 ? 'success' : 'danger'}>{remaining}</Badge>
          </small>
        </div>

        {loading && <div className="text-center py-3"><Spinner animation="border" size="sm" /> Loading...</div>}

        {/* Step 1: Choose Date */}
        {step === 1 && !loading && (
          <>
            <h6 className="mb-3">Select a new date:</h6>
            <Row className="g-2">
              {summary.map((day) => (
                <Col xs={6} md={4} lg={3} key={day.date}>
                  <Button
                    variant={day.isAvailable ? 'outline-primary' : 'outline-secondary'}
                    className="w-100 mb-2 text-start"
                    disabled={!day.isAvailable}
                    onClick={() => handleDateSelect(day.date)}
                  >
                    <div className="fw-bold">{new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <small>
                      {day.isAvailable ? (
                        <span className="text-success">{day.availableSlots} slots</span>
                      ) : (
                        <span className="text-danger">{day.exception || 'Unavailable'}</span>
                      )}
                    </small>
                  </Button>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* Step 2: Choose Slot */}
        {step === 2 && !loading && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h6>
              <Button variant="link" size="sm" onClick={() => setStep(1)}>← Back to dates</Button>
            </div>
            {slots.length === 0 ? (
              <Alert variant="warning">No available slots on this date.</Alert>
            ) : (
              <Row className="g-2">
                {slots.map((slot) => (
                  <Col xs={4} md={3} key={slot.startTime}>
                    <Button
                      variant={selectedSlot === slot.startTime ? 'primary' : 'outline-primary'}
                      className="w-100"
                      onClick={() => setSelectedSlot(slot.startTime)}
                    >
                      {slot.startTime}
                    </Button>
                  </Col>
                ))}
              </Row>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        {step === 2 && (
          <Button
            variant="primary"
            onClick={handleReschedule}
            disabled={!selectedSlot || submitting}
          >
            {submitting ? 'Rescheduling...' : `Reschedule to ${selectedSlot}`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default RescheduleModal;
