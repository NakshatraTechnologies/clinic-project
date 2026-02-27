const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
    },
    dosage: {
      type: String, // e.g., "500mg"
      default: '',
    },
    frequency: {
      type: String, // e.g., "1-0-1" (morning-afternoon-night)
      default: '',
    },
    duration: {
      type: String, // e.g., "5 days", "1 week"
      default: '',
    },
    instructions: {
      type: String, // e.g., "After food"
      default: '',
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is required'],
    },
    // Multi-tenant: which clinic this prescription belongs to
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    diagnosis: {
      type: String,
      default: '',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
    labTests: {
      type: [String], // Recommended lab tests
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
