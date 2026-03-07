const mongoose = require('mongoose');

// Auto-increment ticket number
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin', 'clinic_admin', 'receptionist'],
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raisedByRole: {
      type: String,
      enum: ['patient', 'clinic_admin'],
      required: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      default: null,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ['technical', 'billing', 'appointment', 'general', 'complaint'],
        message: '{VALUE} is not a valid category',
      },
      default: 'general',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in_progress', 'resolved', 'closed'],
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    messages: [messageSchema],
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
supportTicketSchema.index({ raisedBy: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ clinicId: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ createdAt: -1 });

// Auto-generate ticket number before save
supportTicketSchema.pre('save', async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        'ticketNumber',
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.ticketNumber = `TKT-${String(counter.seq).padStart(5, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
