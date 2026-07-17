const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const products = await Product.find({
      ownerId: req.user.userId,
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { brand: { $regex: req.params.query, $options: 'i' } }
      ]
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const product = new Product({ ...req.body, ownerId: req.user.userId });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ ownerId: req.user.userId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { returnDocument: 'after' }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Receive stock as new lot
router.post('/:id/receive', async (req, res) => {
  try {
    const { quantity, costPrice, unit, supplierId, supplierName, invoiceNumber, invoiceDate } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    if (!costPrice || costPrice <= 0) return res.status(400).json({ error: 'Cost price must be positive' });

    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const unitsPerCase = product.unitsPerCase || 1;
    let totalUnits;
    let costPricePerUnit;
    let costPricePerCase;

    if (unit === 'cases') {
      totalUnits = quantity * unitsPerCase;
      costPricePerCase = costPrice;
      costPricePerUnit = costPrice / unitsPerCase;
    } else {
      totalUnits = quantity;
      costPricePerUnit = costPrice;
      costPricePerCase = costPrice * unitsPerCase;
    }

    product.lots.push({
      quantity: totalUnits,
      costPrice: costPricePerUnit,
      costPricePerCase,
      supplierId: supplierId || null,
      supplierName: supplierName || null,
      invoiceNumber: invoiceNumber || null,
      invoiceDate: invoiceDate || null,
      receivedAt: new Date()
    });

    product.stock += totalUnits;
    product.costPrice = costPricePerUnit;

    if (supplierId && !product.suppliers.includes(supplierId)) {
      product.suppliers.push(supplierId);
    }

    await product.save();
    res.json({
      product,
      summary: { totalUnits, costPricePerUnit, costPricePerCase, totalCost: totalUnits * costPricePerUnit }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update suppliers
router.patch('/:id/suppliers', async (req, res) => {
  try {
    const { primarySupplier, suppliers } = req.body;
    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (primarySupplier !== undefined) product.primarySupplier = primarySupplier;
    if (suppliers !== undefined) product.suppliers = suppliers;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add variant
router.post('/:id/variants', async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    if (!name || !quantity || !price) {
      return res.status(400).json({ error: 'name, quantity and price are required' });
    }
    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.variants.push({ name, quantity, price });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete variant
router.delete('/:id/variants/:variantId', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.variants = product.variants.filter(v => v._id.toString() !== req.params.variantId);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restock
router.patch('/:id/restock', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });

    const product = await Product.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.stock += quantity;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;