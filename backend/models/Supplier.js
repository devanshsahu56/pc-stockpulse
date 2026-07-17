const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  phone: { type: String },
  city: { type: String },
  gstNumber: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);