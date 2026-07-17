const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
});

const saleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  brand: String,
  variantName: String,
  variantQuantity: Number,
  quantity: { type: Number, required: true },
  costPrice: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  discountType: { type: String, enum: ['flat', 'percentage'], default: 'flat' },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customerName: { type: String, default: 'Walk-in Customer' },
  shopName: { type: String, default: '—' },
  isWalkIn: { type: Boolean, default: false },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalProfit: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['paid', 'unpaid', 'partial'], default: 'paid' },
  paymentHistory: [paymentHistorySchema],
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);