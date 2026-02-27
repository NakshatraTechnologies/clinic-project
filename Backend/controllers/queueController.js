const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// ==========================================
// @desc    Get today's queue for a doctor
// @route   GET /api/queue/today
// @access  Private (Doctor, Receptionist)
// ==========================================
const getTodayQueue = async (req, res) => {
  try {
    // Determine doctor ID
    let doctorId;
    if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    } else if (req.user.role === 'receptionist') {
      doctorId = req.user.createdBy;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    })
      .populate('patients.patientId', 'name phone gender')
      .populate('patients.appointmentId', 'startTime endTime type notes');

    // If no queue exists for today, create one
    if (!queue) {
      queue = await Queue.create({
        doctorId,
        date: today,
        currentToken: 0,
        totalTokensIssued: 0,
        patients: [],
      });
    }

    // Calculate stats
    const stats = {
      totalInQueue: queue.patients.length,
      waiting: queue.patients.filter((p) => p.status === 'waiting').length,
      inConsultation: queue.patients.filter(
        (p) => p.status === 'in-consultation'
      ).length,
      completed: queue.patients.filter((p) => p.status === 'completed').length,
      skipped: queue.patients.filter((p) => p.status === 'skipped').length,
      currentToken: queue.currentToken,
    };

    res.status(200).json({
      success: true,
      queue,
      stats,
    });
  } catch (error) {
    console.error('Get Today Queue Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Add patient to queue (Check-in)
// @route   POST /api/queue/check-in
// @access  Private (Doctor, Receptionist)
// ==========================================
const checkInPatient = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required',
      });
    }

    // Get the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Determine doctor ID
    let doctorId;
    if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    } else if (req.user.role === 'receptionist') {
      doctorId = req.user.createdBy;
    }

    // Verify this appointment belongs to this doctor
    if (appointment.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This appointment does not belong to your clinic',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get or create today's queue
    let queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!queue) {
      queue = await Queue.create({
        doctorId,
        date: today,
        currentToken: 0,
        totalTokensIssued: 0,
        patients: [],
      });
    }

    // Check if patient already in queue
    const alreadyInQueue = queue.patients.some(
      (p) => p.appointmentId.toString() === appointmentId
    );
    if (alreadyInQueue) {
      return res.status(400).json({
        success: false,
        message: 'Patient is already checked in',
      });
    }

    // Assign token number
    queue.totalTokensIssued += 1;
    const tokenNumber = queue.totalTokensIssued;

    // Add to queue
    queue.patients.push({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      tokenNumber,
      status: 'waiting',
      checkInTime: new Date(),
    });

    await queue.save();

    // Update appointment status
    appointment.status = 'confirmed';
    await appointment.save();

    // Populate and return
    const updatedQueue = await Queue.findById(queue._id)
      .populate('patients.patientId', 'name phone gender')
      .populate('patients.appointmentId', 'startTime endTime type');

    res.status(200).json({
      success: true,
      message: `Patient checked in. Token #${tokenNumber}`,
      tokenNumber,
      queue: updatedQueue,
    });
  } catch (error) {
    console.error('Check-in Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in patient',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Update patient status in queue
// @route   PUT /api/queue/patient/:appointmentId/status
// @access  Private (Doctor, Receptionist)
// ==========================================
const updateQueuePatientStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body; // 'in-consultation', 'completed', 'skipped'

    const validStatuses = ['waiting', 'in-consultation', 'completed', 'skipped'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    let doctorId;
    if (req.user.role === 'doctor') {
      doctorId = req.user._id;
    } else if (req.user.role === 'receptionist') {
      doctorId = req.user.createdBy;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: "No queue found for today",
      });
    }

    // Find patient in queue
    const patientInQueue = queue.patients.find(
      (p) => p.appointmentId.toString() === appointmentId
    );

    if (!patientInQueue) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found in queue',
      });
    }

    // Update status
    patientInQueue.status = status;

    // If in-consultation, update current token
    if (status === 'in-consultation') {
      queue.currentToken = patientInQueue.tokenNumber;
    }

    // If completed, set checkout time & update appointment
    if (status === 'completed') {
      patientInQueue.checkOutTime = new Date();
      // Also mark appointment as completed
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'completed',
      });
    }

    // If skipped, mark appointment as no-show
    if (status === 'skipped') {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'no-show',
      });
    }

    await queue.save();

    const updatedQueue = await Queue.findById(queue._id)
      .populate('patients.patientId', 'name phone gender')
      .populate('patients.appointmentId', 'startTime endTime type');

    res.status(200).json({
      success: true,
      message: `Patient status updated to ${status}`,
      queue: updatedQueue,
    });
  } catch (error) {
    console.error('Update Queue Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient status',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Call next patient (auto-advance queue)
// @route   PUT /api/queue/next
// @access  Private (Doctor)
// ==========================================
const callNextPatient = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const queue = await Queue.findOne({
      doctorId,
      date: { $gte: today, $lte: endOfDay },
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'No queue found for today',
      });
    }

    // Mark current in-consultation as completed
    const currentPatient = queue.patients.find(
      (p) => p.status === 'in-consultation'
    );
    if (currentPatient) {
      currentPatient.status = 'completed';
      currentPatient.checkOutTime = new Date();
      await Appointment.findByIdAndUpdate(currentPatient.appointmentId, {
        status: 'completed',
      });
    }

    // Find next waiting patient
    const nextPatient = queue.patients.find((p) => p.status === 'waiting');

    if (!nextPatient) {
      await queue.save();
      return res.status(200).json({
        success: true,
        message: 'No more patients waiting',
        queue,
      });
    }

    // Move next patient to in-consultation
    nextPatient.status = 'in-consultation';
    queue.currentToken = nextPatient.tokenNumber;

    await queue.save();

    const updatedQueue = await Queue.findById(queue._id)
      .populate('patients.patientId', 'name phone gender')
      .populate('patients.appointmentId', 'startTime endTime type');

    res.status(200).json({
      success: true,
      message: `Calling Token #${nextPatient.tokenNumber}`,
      currentToken: nextPatient.tokenNumber,
      queue: updatedQueue,
    });
  } catch (error) {
    console.error('Call Next Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call next patient',
      error: error.message,
    });
  }
};

module.exports = {
  getTodayQueue,
  checkInPatient,
  updateQueuePatientStatus,
  callNextPatient,
};
