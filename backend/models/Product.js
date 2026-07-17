const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  costPricePerCase: { type: Number },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  receivedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String },

  // Product Type
  soldLoose: { type: Boolean, default: true }, // true = Loose + Full Case, false = Full Case Only

  // Case Info
  unitsPerCase: { type: Number, default: 1 }, // Total pieces in one case

  // Pricing — Loose + Full Case
  mrp: { type: Number, default: 0 },           // MRP per piece
  mrpPerCase: { type: Number, default: 0 },    // MRP per case (auto calculated)
  sellingPricePerPiece: { type: Number, default: 0 },
  sellingPricePerCase: { type: Number, default: 0 },
  costPricePerCase: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },     // cost per piece (derived)

  // Pricing — Full Case Only
  buyingPricePerCase: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },  // selling per case for case only
  lots: [lotSchema],
  stock: { type: Number, required: true, default: 0 },
  reorderThreshold: { type: Number, default: 10 },
  primarySupplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    default: null
  },
  suppliers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }]
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);