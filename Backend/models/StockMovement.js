const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Item ID is required'],
    },
    type: {
      type: String,
      enum: ['purchase', 'consumption', 'adjustment', 'return'],
      required: [true, 'Movement type is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      // Positive = stock in, Negative = stock out
    },
    unitCost: {
      type: Number,
      default: 0,
      min: [0, 'Unit cost cannot be negative'],
    },
    reference: {
      type: String,
      trim: true,
      default: '',
      // Invoice number, PO number, etc.
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performed by is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    batchNo: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
stockMovementSchema.index({ clinicId: 1, itemId: 1 });
stockMovementSchema.index({ clinicId: 1, type: 1 });
stockMovementSchema.index({ clinicId: 1, date: -1 });
stockMovementSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
