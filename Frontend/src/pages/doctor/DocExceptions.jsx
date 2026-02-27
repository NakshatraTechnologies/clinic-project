import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Alert } from 'react-bootstrap';
import { FaCalendarTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { createScheduleException, getMyExceptions, deleteScheduleException } from '../../services/api';

const DocExceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    date: '',
    type: 'leave',
    reason: '',
    slots: [],
  });

  // Override slot form (shown only when type === 'override')
  const [overrideSlot, setOverrideSlot] = useState({ startTime: '', endTime: '' });

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await getMyExceptions();
      setExceptions(res.data.exceptions || []);
    } catch (err) {
      setError('Failed to load exceptions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.date || !form.type) {
      setError('Date and type are required');
      return;
    }

    try {
      setSubmitting(true);
      await createScheduleException(form);
      setSuccess(`Exception added for ${form.date}`);
      setForm({ date: '', type: 'leave', reason: '', slots: [] });
      fetchExceptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exception');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exception?')) return;
    try {
      await deleteScheduleException(id);
      setSuccess('Exception deleted');
      fetchExceptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const addOverrideSlot = () => {
    if (!overrideSlot.startTime || !overrideSlot.endTime) return;
    setForm({ ...form, slots: [...form.slots, { ...overrideSlot }] });
    setOverrideSlot({ startTime: '', endTime: '' });
  };

  const removeOverrideSlot = (index) => {
    setForm({ ...form, slots: form.slots.filter((_, i) => i !== index) });
  };

  const getTypeBadge = (type) => {
    const colors = { holiday: 'danger', leave: 'warning', override: 'info' };
    return <Badge bg={colors[type] || 'secondary'}>{type}</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <h3 className="mb-4">
        <FaCalendarTimes className="me-2 text-danger" />
        Schedule Exceptions
      </h3>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        {/* Add Exception Form */}
        <Col md={5}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white">
              <FaPlus className="me-2" /> Add Exception
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value, slots: [] })}
                  >
                    <option value="leave">Leave (Full Day Off)</option>
                    <option value="holiday">Holiday (Full Day Off)</option>
                    <option value="override">Override (Custom Hours)</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Reason (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Personal leave, Festival..."
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  />
                </Form.Group>

                {/* Override slots */}
                {form.type === 'override' && (
                  <div className="mb-3">
                    <Form.Label>Override Time Slots</Form.Label>
                    {form.slots.map((slot, i) => (
                      <div key={i} className="d-flex align-items-center mb-2">
                        <Badge bg="info" className="me-2">{slot.startTime} - {slot.endTime}</Badge>
                        <Button variant="outline-danger" size="sm" onClick={() => removeOverrideSlot(i)}>
                          <FaTrash />
                        </Button>
                      </div>
                    ))}
                    <Row className="g-2">
                      <Col>
                        <Form.Control
                          type="time"
                          value={overrideSlot.startTime}
                          onChange={(e) => setOverrideSlot({ ...overrideSlot, startTime: e.target.value })}
                          placeholder="Start"
                        />
                      </Col>
                      <Col>
                        <Form.Control
                          type="time"
                          value={overrideSlot.endTime}
                          onChange={(e) => setOverrideSlot({ ...overrideSlot, endTime: e.target.value })}
                          placeholder="End"
                        />
                      </Col>
                      <Col xs="auto">
                        <Button variant="outline-primary" onClick={addOverrideSlot}>+ Add</Button>
                      </Col>
                    </Row>
                    <Form.Text className="text-muted">
                      Add custom time slots for this day (replaces weekly schedule)
                    </Form.Text>
                  </div>
                )}

                <Button type="submit" variant="primary" disabled={submitting} className="w-100">
                  {submitting ? 'Adding...' : 'Add Exception'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Exceptions List */}
        <Col md={7}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <strong>Upcoming Exceptions</strong>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : exceptions.length === 0 ? (
                <div className="text-center py-4 text-muted">No exceptions scheduled</div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Slots</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map((exc) => (
                      <tr key={exc._id}>
                        <td>{new Date(exc.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{getTypeBadge(exc.type)}</td>
                        <td>{exc.reason || '-'}</td>
                        <td>
                          {exc.type === 'override' && exc.slots?.length > 0
                            ? exc.slots.map((s, i) => <Badge key={i} bg="light" text="dark" className="me-1">{s.startTime}-{s.endTime}</Badge>)
                            : <span className="text-muted">Full day off</span>
                          }
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(exc._id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DocExceptions;
