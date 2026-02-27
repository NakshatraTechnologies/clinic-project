const mongoose = require('mongoose');

const queuePatientSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-consultation', 'completed', 'skipped'],
      default: 'waiting',
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const queueSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    currentToken: {
      type: Number,
      default: 0,
    },
    totalTokensIssued: {
      type: Number,
      default: 0,
    },
    patients: {
      type: [queuePatientSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One queue per doctor per day
queueSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Queue', queueSchema);
