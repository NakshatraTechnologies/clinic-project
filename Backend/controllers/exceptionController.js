const ScheduleException = require('../models/ScheduleException');
const DoctorProfile = require('../models/DoctorProfile');

// ==========================================
// @desc    Create a schedule exception (holiday/leave/override)
// @route   POST /api/slots/exceptions
// @access  Private (Doctor only)
// ==========================================
const createException = async (req, res) => {
  try {
    const { date, type, reason, slots } = req.body;

    if (!date || !type) {
      return res.status(400).json({
        success: false,
        message: 'Date and type are required',
      });
    }

    // Validate type
    const validTypes = ['holiday', 'leave', 'override'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Validate date is in the future
    const exceptionDate = new Date(date);
    if (isNaN(exceptionDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (exceptionDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create exception for past dates',
      });
    }

    // For override type, validate slots
    if (type === 'override' && slots && slots.length > 0) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      for (const slot of slots) {
        if (!slot.startTime || !slot.endTime) {
          return res.status(400).json({
            success: false,
            message: 'Override slots must have startTime and endTime',
          });
        }
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid time format in override slots. Use HH:mm',
          });
        }
        if (slot.startTime >= slot.endTime) {
          return res.status(400).json({
            success: false,
            message: `Start time (${slot.startTime}) must be before end time (${slot.endTime})`,
          });
        }
      }
    }

    // Get doctor profile for clinicId
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });

    const exception = await ScheduleException.create({
      doctorId: req.user._id,
      clinicId: doctorProfile ? doctorProfile.clinicId : null,
      date: exceptionDate,
      type,
      reason: reason || '',
      slots: type === 'override' ? (slots || []) : [], // holiday/leave = no slots
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Schedule exception (${type}) created for ${date}`,
      exception,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An exception already exists for this date. Delete it first or update it.',
      });
    }
    console.error('Create Exception Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule exception',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get my schedule exceptions
// @route   GET /api/slots/exceptions
// @access  Private (Doctor only)
// ==========================================
const getMyExceptions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = { doctorId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const exceptions = await ScheduleException.find(filter)
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: exceptions.length,
      exceptions,
    });
  } catch (error) {
    console.error('Get My Exceptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exceptions',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's schedule exceptions (public)
// @route   GET /api/slots/exceptions/:doctorId
// @access  Public
// ==========================================
const getDoctorExceptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Only return future exceptions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exceptions = await ScheduleException.find({
      doctorId,
      date: { $gte: today },
    })
      .select('date type reason slots')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: exceptions.length,
      exceptions,
    });
  } catch (error) {
    console.error('Get Doctor Exceptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get doctor exceptions',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Delete a schedule exception
// @route   DELETE /api/slots/exceptions/:id
// @access  Private (Doctor only)
// ==========================================
const deleteException = async (req, res) => {
  try {
    const { id } = req.params;

    const exception = await ScheduleException.findById(id);

    if (!exception) {
      return res.status(404).json({
        success: false,
        message: 'Exception not found',
      });
    }

    // Only the doctor who created it can delete
    if (exception.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exception',
      });
    }

    await ScheduleException.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Exception deleted successfully',
    });
  } catch (error) {
    console.error('Delete Exception Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exception',
      error: error.message,
    });
  }
};

module.exports = {
  createException,
  getMyExceptions,
  getDoctorExceptions,
  deleteException,
};
