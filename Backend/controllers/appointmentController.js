const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Queue = require('../models/Queue');
const ScheduleException = require('../models/ScheduleException');
const { getAvailableSlots, timeToMinutes } = require('../utils/slotGenerator');
const { addAuditLog } = require('../utils/auditLogger');
const { sendBookingConfirmation, sendCancellationNotice, sendRescheduleNotice, sendStatusUpdate } = require('../utils/notificationService');

// ==========================================
// @desc    Book an appointment
// @route   POST /api/appointments/book
// @access  Private (Patient, Receptionist)
// ==========================================
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, notes, type, patientId } = req.body;

    // Validation
    if (!doctorId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, date, and start time are required',
      });
    }

    // Determine the actual patient
    // If receptionist is booking for walk-in, they provide patientId
    // If patient is booking themselves, use logged-in user
    let actualPatientId = req.user._id;
    let bookingType = type || 'online';

    if (req.user.role === 'receptionist') {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Receptionist must provide patientId for booking',
        });
      }
      actualPatientId = patientId;
      bookingType = 'walk-in';
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Validate the date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book for past dates',
      });
    }

    // Get existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    });

    // --- Check for schedule exception on the requested date ---
    const exception = await ScheduleException.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (exception && (exception.type === 'holiday' || exception.type === 'leave')) {
      return res.status(400).json({
        success: false,
        message: `Doctor is unavailable on this date (${exception.type}${exception.reason ? ': ' + exception.reason : ''})`,
      });
    }

    // Check slot availability using the generator
    const slotData = getAvailableSlots(doctorProfile, targetDate, existingAppointments);

    if (!slotData.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${slotData.dayName}`,
      });
    }

    // Check if the requested slot is available
    const isSlotAvailable = slotData.availableSlots.some(
      (slot) => slot.startTime === startTime
    );

    if (!isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: `Slot ${startTime} is not available. It may be already booked or in the past.`,
        availableSlots: slotData.availableSlots,
      });
    }

    // Calculate end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + doctorProfile.slotDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Create the appointment
    const appointment = await Appointment.create({
      patientId: actualPatientId,
      doctorId,
      date: startOfDay,
      startTime,
      endTime,
      status: 'confirmed',
      type: bookingType,
      paymentStatus: 'pending',
      amount: doctorProfile.consultationFee,
      notes: notes || '',
      bookedBy: req.user._id,
      auditLog: [{
        action: 'created',
        performedBy: req.user._id,
        timestamp: new Date(),
        details: `Appointment booked (${bookingType}) for ${date} at ${startTime}`,
        newValue: 'confirmed',
      }],
    });

    // Populate patient and doctor info
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name phone email');

    // Fire notification (non-blocking)
    sendBookingConfirmation(populatedAppointment, populatedAppointment.patientId, populatedAppointment.doctorId)
      .catch(err => console.error('Notification Error:', err));

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: populatedAppointment,
    });
  } catch (error) {
    // Handle duplicate booking (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This slot is already booked. Please choose another slot.',
      });
    }
    console.error('Book Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Cancel an appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private (Patient, Doctor, Receptionist)
// ==========================================
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check authorization
    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isDoctor = appointment.doctorId.toString() === req.user._id.toString();
    const isReceptionist = req.user.role === 'receptionist';
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isReceptionist && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment',
      });
    }

    // Cannot cancel already completed or cancelled
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment with status: ${appointment.status}`,
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason || 'Cancelled by user';
    appointment.cancelledBy = req.user._id;

    // Add audit log entry
    addAuditLog(
      appointment,
      'cancelled',
      req.user._id,
      `Cancelled by ${req.user.role}${reason ? ': ' + reason : ''}`,
      appointment.status === 'confirmed' ? 'confirmed' : 'pending',
      'cancelled'
    );

    await appointment.save();

    // Fire cancellation notification (non-blocking)
    const patient = await User.findById(appointment.patientId).select('name phone email');
    const doctor = await User.findById(appointment.doctorId).select('name phone email');
    sendCancellationNotice(appointment, patient, doctor, req.user.role)
      .catch(err => console.error('Notification Error:', err));

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    console.error('Cancel Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get patient's appointments
// @route   GET /api/appointments/my
// @access  Private (Patient)
// ==========================================
const getMyAppointments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { patientId: req.user._id };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'name phone email')
      .populate('bookedBy', 'name role')
      .sort({ date: -1, startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      appointments,
    });
  } catch (error) {
    console.error('Get My Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's appointments for a date
// @route   GET /api/appointments/doctor/:date
// @access  Private (Doctor, Receptionist)
// ==========================================
const getDoctorAppointments = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 15 } = req.query;

    // Determine which doctor's appointments to fetch
    let doctorId;
    if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    } else if (req.user.role === 'receptionist') {
      // Receptionist sees their doctor's appointments
      doctorId = req.user.createdBy;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view doctor appointments',
      });
    }

    let filter = { doctorId };

    if (date && date !== 'all') {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }

    const appointmentsList = await Appointment.find(filter)
      .populate('patientId', 'name phone email gender dateOfBirth bloodGroup allergies')
      .populate('bookedBy', 'name role')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      totalPages: Math.ceil(total / limit),
      appointments: appointmentsList,
    });
  } catch (error) {
    console.error('Get Doctor Appointments Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Update appointment status (Doctor/Receptionist)
// @route   PUT /api/appointments/:id/status
// @access  Private (Doctor, Receptionist)
// ==========================================
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paymentMethod } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Status transition rules
    const validTransitions = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['completed', 'cancelled', 'no-show'],
      'completed': [],   // terminal
      'cancelled': [],    // terminal
      'no-show': [],      // terminal
    };

    if (status) {
      const allowed = validTransitions[appointment.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from '${appointment.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`,
        });
      }

      const oldStatus = appointment.status;
      appointment.status = status;

      // Add audit log
      addAuditLog(
        appointment,
        status === 'no-show' ? 'no-show' : status,
        req.user._id,
        `Status changed by ${req.user.role}`,
        oldStatus,
        status
      );
    }

    if (paymentStatus) {
      const oldPayment = appointment.paymentStatus;
      appointment.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        addAuditLog(appointment, 'payment', req.user._id, `Payment marked as paid via ${paymentMethod || 'unknown'}`, oldPayment, paymentStatus);
      }
    }
    if (paymentMethod) appointment.paymentMethod = paymentMethod;

    await appointment.save();

    const updated = await Appointment.findById(id)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updated,
    });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Reschedule an appointment
// @route   PUT /api/appointments/:id/reschedule
// @access  Private (Patient, Doctor, Receptionist)
// ==========================================
const rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'New date and startTime are required for rescheduling',
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only pending or confirmed can be rescheduled
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule appointment with status: ${appointment.status}`,
      });
    }

    // Check authorization
    const isPatient = appointment.patientId.toString() === req.user._id.toString();
    const isDoctor = appointment.doctorId.toString() === req.user._id.toString();
    const isReceptionist = req.user.role === 'receptionist';
    if (!isPatient && !isDoctor && !isReceptionist) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule' });
    }

    // Get doctor profile for reschedule policy
    const doctorProfile = await DoctorProfile.findOne({ userId: appointment.doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Check reschedule count limit
    const maxReschedules = doctorProfile.maxReschedules || 2;
    if (appointment.rescheduleCount >= maxReschedules) {
      return res.status(400).json({
        success: false,
        message: `Maximum reschedule limit (${maxReschedules}) reached. Please cancel and book a new appointment.`,
      });
    }

    // Check minimum hours before appointment (only for patients)
    if (isPatient) {
      const minHours = doctorProfile.minRescheduleHours || 2;
      const appointmentDateTime = new Date(appointment.date);
      const [h, m] = appointment.startTime.split(':').map(Number);
      appointmentDateTime.setHours(h, m, 0, 0);
      const hoursUntil = (appointmentDateTime - new Date()) / (1000 * 60 * 60);

      if (hoursUntil < minHours) {
        return res.status(400).json({
          success: false,
          message: `Cannot reschedule within ${minHours} hours of the appointment.`,
        });
      }
    }

    // Validate new date
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot reschedule to a past date' });
    }

    // Check for exceptions on the new date
    const newStartOfDay = new Date(date);
    newStartOfDay.setHours(0, 0, 0, 0);
    const newEndOfDay = new Date(date);
    newEndOfDay.setHours(23, 59, 59, 999);

    const exception = await ScheduleException.findOne({
      doctorId: appointment.doctorId,
      date: { $gte: newStartOfDay, $lte: newEndOfDay },
    });

    if (exception && (exception.type === 'holiday' || exception.type === 'leave')) {
      return res.status(400).json({
        success: false,
        message: `Doctor is unavailable on the new date (${exception.type})`,
      });
    }

    // Check new slot availability
    const existingAppointments = await Appointment.find({
      doctorId: appointment.doctorId,
      date: { $gte: newStartOfDay, $lte: newEndOfDay },
      status: { $ne: 'cancelled' },
      _id: { $ne: appointment._id }, // Exclude current appointment
    });

    const slotData = getAvailableSlots(doctorProfile, newDate, existingAppointments);
    const isSlotAvailable = slotData.availableSlots.some(s => s.startTime === startTime);

    if (!isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: `Slot ${startTime} is not available on ${date}.`,
        availableSlots: slotData.availableSlots,
      });
    }

    // Calculate new end time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + doctorProfile.slotDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Save old values for audit
    const oldDate = appointment.date;
    const oldStartTime = appointment.startTime;

    // Update appointment
    appointment.date = newStartOfDay;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.rescheduleCount += 1;
    appointment.status = 'confirmed';

    // Add audit log
    addAuditLog(
      appointment,
      'rescheduled',
      req.user._id,
      `Rescheduled by ${req.user.role} (${appointment.rescheduleCount}/${maxReschedules})`,
      `${oldDate.toISOString().split('T')[0]} ${oldStartTime}`,
      `${date} ${startTime}`
    );

    await appointment.save();

    const updated = await Appointment.findById(id)
      .populate('patientId', 'name phone email')
      .populate('doctorId', 'name phone');

    res.status(200).json({
      success: true,
      message: `Appointment rescheduled successfully (${appointment.rescheduleCount}/${maxReschedules} reschedules used)`,
      appointment: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'The new slot is already booked. Please choose another slot.',
      });
    }
    console.error('Reschedule Appointment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get appointment audit log
// @route   GET /api/appointments/:id/audit
// @access  Private (Doctor, Admin)
// ==========================================
const getAppointmentAudit = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id)
      .select('auditLog status patientId doctorId date startTime')
      .populate('auditLog.performedBy', 'name role')
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name phone');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only doctor of this appointment or admin can view audit
    const isDoctor = appointment.doctorId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isDoctor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view audit log' });
    }

    res.status(200).json({
      success: true,
      appointment: {
        _id: appointment._id,
        status: appointment.status,
        patient: appointment.patientId,
        doctor: appointment.doctorId,
        date: appointment.date,
        startTime: appointment.startTime,
      },
      auditLog: appointment.auditLog || [],
    });
  } catch (error) {
    console.error('Get Audit Log Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get audit log' });
  }
};

module.exports = {
  bookAppointment,
  cancelAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentAudit,
};
