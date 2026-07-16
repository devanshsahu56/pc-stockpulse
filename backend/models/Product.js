const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const lotSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },      // always per unit
  costPricePerCase: { type: Number },               // per case for reference
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  supplierName: { type: String },
  invoiceNumber: { type: String },
  invoiceDate: { type: Date },
  receivedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String },
    mrp: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    costPrice: { type: Number, required: true, default: 0 },
    soldLoose: { type: Boolean, default: true },
    unitsPerCase: { type: Number, default: 1 },
    variants: [variantSchema],
    lots: [lotSchema],
    stock: { type: Number, required: true, default: 0 },
    reorderThreshold: { type: Number, default: 10 },
    primarySupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
    suppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Supplier",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
