const mongoose = require('mongoose');

const scheduleExceptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null,
    },
    date: {
      type: Date,
      required: [true, 'Exception date is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['holiday', 'leave', 'override'],
        message: '{VALUE} is not a valid exception type',
      },
      required: [true, 'Exception type is required'],
    },
    // For 'override': custom slots that replace the weekly pattern for this date
    // Empty array = full day off (used for holiday/leave)
    slots: [
      {
        startTime: {
          type: String, // Format: "HH:mm" (24hr)
        },
        endTime: {
          type: String,
        },
      },
    ],
    reason: {
      type: String,
      default: '',
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// One exception per doctor per date
scheduleExceptionSchema.index({ doctorId: 1, date: 1 }, { unique: true });
scheduleExceptionSchema.index({ doctorId: 1, date: 1, clinicId: 1 });

module.exports = mongoose.model('ScheduleException', scheduleExceptionSchema);
