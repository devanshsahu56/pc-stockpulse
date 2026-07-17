const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  shopName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  totalPurchases: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);