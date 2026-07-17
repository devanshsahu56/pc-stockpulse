const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Search customers
router.get('/search/:query', async (req, res) => {
  try {
    const customers = await Customer.find({
      ownerId: req.user.userId,
      $or: [
        { name: { $regex: req.params.query, $options: 'i' } },
        { shopName: { $regex: req.params.query, $options: 'i' } }
      ]
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const customer = new Customer({ ...req.body, ownerId: req.user.userId });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({ ownerId: req.user.userId }).sort({ totalPurchases: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, ownerId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      req.body,
      { returnDocument: 'after' }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, ownerId: req.user.userId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;