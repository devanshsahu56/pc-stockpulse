const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');

// Search suppliers
router.get('/search/:query', async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      ownerId: req.user.userId,
      isActive: true,
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { city: { $regex: req.params.query, $options: 'i' } }
      ]
    });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ ownerId: req.user.userId, isActive: true }).sort({ name: 1 });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create supplier
router.post('/', async (req, res) => {
  try {
    const supplier = new Supplier({ ...req.body, ownerId: req.user.userId });
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { returnDocument: 'after' }
    );
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Soft delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { isActive: false },
      { returnDocument: 'after' }
    );
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;