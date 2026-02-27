const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      enum: ['medicine', 'consumable', 'equipment'],
      required: [true, 'Category is required'],
    },
    unit: {
      type: String,
      enum: ['pcs', 'box', 'strip', 'bottle', 'kg', 'ltr', 'pair', 'set', 'vial', 'tube'],
      default: 'pcs',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: [0, 'Selling price cannot be negative'],
    },
    stockQty: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: [0, 'Reorder level cannot be negative'],
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    batchNo: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
inventoryItemSchema.index({ clinicId: 1, category: 1 });
inventoryItemSchema.index({ clinicId: 1, sku: 1 }, { unique: true, sparse: true });
inventoryItemSchema.index({ clinicId: 1, expiryDate: 1 });
inventoryItemSchema.index({ clinicId: 1, stockQty: 1 });
inventoryItemSchema.index({ clinicId: 1, name: 'text' });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
