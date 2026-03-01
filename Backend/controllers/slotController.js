const DoctorProfile = require('../models/DoctorProfile');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const ScheduleException = require('../models/ScheduleException');
const { getAvailableSlots, getDayName } = require('../utils/slotGenerator');

// ==========================================
// @desc    Update doctor availability schedule
// @route   PUT /api/slots/availability
// @access  Private (Doctor only)
// ==========================================
const updateAvailability = async (req, res) => {
  try {
    const { availability, slotDuration } = req.body;

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({
        success: false,
        message: 'Availability schedule is required (array of day objects)',
      });
    }

    // Validate each day entry
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const entry of availability) {
      if (!validDays.includes(entry.day)) {
        return res.status(400).json({
          success: false,
          message: `Invalid day: ${entry.day}. Must be one of: ${validDays.join(', ')}`,
        });
      }

      // Validate time slots
      if (entry.isAvailable && entry.slots) {
        for (const slot of entry.slots) {
          if (!slot.startTime || !slot.endTime) {
            return res.status(400).json({
              success: false,
              message: `Each slot must have startTime and endTime (HH:mm format)`,
            });
          }

          // Validate time format
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
            return res.status(400).json({
              success: false,
              message: `Invalid time format. Use HH:mm (24-hour format). Got: ${slot.startTime} - ${slot.endTime}`,
            });
          }

          // Ensure start time is before end time
          if (slot.startTime >= slot.endTime) {
            return res.status(400).json({
              success: false,
              message: `Start time (${slot.startTime}) must be before end time (${slot.endTime})`,
            });
          }
        }
      }
    }

    let doctorProfile = await DoctorProfile.findOne({ userId: req.user._id });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please complete your doctor registration first.',
      });
    }

    // Update availability
    doctorProfile.availability = availability;

    // Update slot duration if provided
    if (slotDuration) {
      const validDurations = [10, 15, 20, 30, 45, 60];
      if (!validDurations.includes(slotDuration)) {
        return res.status(400).json({
          success: false,
          message: `Invalid slot duration. Must be one of: ${validDurations.join(', ')} minutes`,
        });
      }
      doctorProfile.slotDuration = slotDuration;
    }

    // Update buffer time if provided
    if (req.body.bufferTime !== undefined) {
      const validBuffers = [0, 5, 10, 15];
      if (!validBuffers.includes(req.body.bufferTime)) {
        return res.status(400).json({
          success: false,
          message: `Invalid buffer time. Must be one of: ${validBuffers.join(', ')} minutes`,
        });
      }
      doctorProfile.bufferTime = req.body.bufferTime;
    }

    // Update timezone if provided
    if (req.body.timezone) {
      doctorProfile.timezone = req.body.timezone;
    }

    // Update reschedule policy if provided
    if (req.body.maxReschedules !== undefined) {
      doctorProfile.maxReschedules = req.body.maxReschedules;
    }
    if (req.body.minRescheduleHours !== undefined) {
      doctorProfile.minRescheduleHours = req.body.minRescheduleHours;
    }

    await doctorProfile.save();

    res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability: doctorProfile.availability,
      slotDuration: doctorProfile.slotDuration,
    });
  } catch (error) {
    console.error('Update Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get doctor's availability schedule
// @route   GET /api/slots/availability/:doctorId
// @access  Public
// ==========================================
const getAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      availability: doctorProfile.availability,
      slotDuration: doctorProfile.slotDuration,
    });
  } catch (error) {
    console.error('Get Availability Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability',
      error: error.message,
    });
  }
};

// ==========================================
// @desc    Get available slots for a doctor on a specific date
// @route   GET /api/slots/:doctorId/:date
// @access  Public
// @params  doctorId: MongoDB ObjectId, date: YYYY-MM-DD
// ==========================================
const getSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    // Validate date format
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    // Convert both to local date strings (YYYY-MM-DD) to compare precisely without timezone hour drift
    const today = new Date();
    
    // We get the local date parts rather than relying on UTC ISOString which might lag/lead by hours
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
    
    console.log(`[SLOTS API] Checking Past Date. Incoming Date: ${date} | Server Local Today: ${localToday}`);

    if (date < localToday) {
      return res.status(400).json({
        success: false,
        message: 'Cannot view slots for past dates',
      });
    }

    // Get doctor profile
    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    // Get doctor user info
    const doctor = await User.findById(doctorId).select('name phone');

    // --- Check for schedule exceptions on this date ---
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const exception = await ScheduleException.findOne({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    // If holiday or leave (no override slots), doctor is unavailable
    if (exception && (exception.type === 'holiday' || exception.type === 'leave')) {
      return res.status(200).json({
        success: true,
        doctor: {
          _id: doctorId,
          name: doctor ? doctor.name : '',
          consultationFee: doctorProfile.consultationFee,
          clinicName: doctorProfile.clinicName,
        },
        date,
        isAvailable: false,
        dayName: getDayName(targetDate),
        reason: exception.reason || `Doctor is on ${exception.type}`,
        allSlots: [],
        availableSlots: [],
        bookedSlots: [],
      });
    }

    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    });

    let slotData;

    // If override exception: use its custom slots instead of weekly schedule
    if (exception && exception.type === 'override' && exception.slots.length > 0) {
      // Create a temporary profile-like object with override slots
      const overrideProfile = {
        ...doctorProfile.toObject(),
        availability: [{
          day: getDayName(targetDate),
          isAvailable: true,
          slots: exception.slots,
        }],
      };
      slotData = getAvailableSlots(overrideProfile, targetDate, bookedAppointments);
    } else {
      // Normal weekly schedule
      slotData = getAvailableSlots(doctorProfile, targetDate, bookedAppointments);
    }
    
    console.log(`[SLOTS API] Returning ${slotData.availableSlots?.length} available slots for ${date}`);

    res.status(200).json({
      success: true,
      doctor: {
        _id: doctorId,
        name: doctor ? doctor.name : '',
        consultationFee: doctorProfile.consultationFee,
        clinicName: doctorProfile.clinicName,
      },
      date,
      ...slotData,
    });
  } catch (error) {
    console.error('Get Slots Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slots',
      error: error.message,
    });
  }
};
// ==========================================
// @desc    Get availability summary for next 14 days
// @route   GET /api/slots/summary/:doctorId
// @access  Public
// ==========================================
const getAvailabilitySummary = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Get appointments for next 14 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    const appointments = await Appointment.find({
      doctorId,
      date: { $gte: today, $lte: twoWeeksLater },
      status: { $ne: 'cancelled' },
    });

    // Generate summary for each day
    // Fetch exceptions for the 14-day range
    const exceptions = await ScheduleException.find({
      doctorId,
      date: { $gte: today, $lte: twoWeeksLater },
    });

    const summary = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      
      const dayAppts = appointments.filter(a => 
        new Date(a.date).toDateString() === d.toDateString()
      );

      // Check if there's an exception for this day
      const dayException = exceptions.find(e =>
        new Date(e.date).toDateString() === d.toDateString()
      );

      // If holiday/leave, mark as unavailable
      if (dayException && (dayException.type === 'holiday' || dayException.type === 'leave')) {
        summary.push({
          date: d.toISOString().split('T')[0],
          dayName: getDayName(d),
          totalSlots: 0,
          availableSlots: 0,
          isAvailable: false,
          exception: dayException.type,
          reason: dayException.reason || '',
        });
        continue;
      }

      let slotData;
      // If override, use custom slots
      if (dayException && dayException.type === 'override' && dayException.slots.length > 0) {
        const overrideProfile = {
          ...doctorProfile.toObject(),
          availability: [{
            day: getDayName(d),
            isAvailable: true,
            slots: dayException.slots,
          }],
        };
        slotData = getAvailableSlots(overrideProfile, d, dayAppts);
      } else {
        slotData = getAvailableSlots(doctorProfile, d, dayAppts);
      }
      
      summary.push({
        date: d.toISOString().split('T')[0],
        dayName: getDayName(d),
        totalSlots: slotData.totalSlots,
        availableSlots: slotData.availableCount,
        isAvailable: slotData.isAvailable && slotData.availableCount > 0,
      });
    }

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('Get Summary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get summary' });
  }
};

module.exports = {
  updateAvailability,
  getAvailability,
  getSlots,
  getAvailabilitySummary,
};
