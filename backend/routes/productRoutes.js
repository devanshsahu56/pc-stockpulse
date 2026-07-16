const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// Search products by name or brand (must be above /:id)
router.get("/search/:query", async (req, res) => {
  try {
    const query = req.params.query;
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
      ],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new product
router.post("/", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a product
router.put("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add a variant to a product
router.post("/:id/variants", async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    if (!name || !quantity || !price) {
      return res
        .status(400)
        .json({ error: "name, quantity and price are required" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.variants.push({ name, quantity, price });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a variant from a product
router.delete("/:id/variants/:variantId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.variants = product.variants.filter(
      (v) => v._id.toString() !== req.params.variantId,
    );
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Receive stock as a new lot
router.post('/:id/receive', async (req, res) => {
  try {
    const { quantity, costPrice, unit, supplierId, supplierName, invoiceNumber, invoiceDate } = req.body;

    if (!quantity || quantity <= 0) return res.status(400).json({ error: 'Quantity must be positive' });
    if (!costPrice || costPrice <= 0) return res.status(400).json({ error: 'Cost price must be positive' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const unitsPerCase = product.unitsPerCase || 1;

    // Calculate total units and per unit cost correctly
    let totalUnits;
    let costPricePerUnit;
    let costPricePerCase;

    if (unit === 'cases') {
      totalUnits = quantity * unitsPerCase;
      costPricePerCase = costPrice;               // what user entered = price per case
      costPricePerUnit = costPrice / unitsPerCase; // derive per unit cost
    } else {
      totalUnits = quantity;
      costPricePerUnit = costPrice;               // what user entered = price per unit
      costPricePerCase = costPrice * unitsPerCase; // derive per case cost
    }

    // Add new lot with both prices stored
    product.lots.push({
      quantity: totalUnits,
      costPrice: costPricePerUnit,       // always store per unit cost for FIFO
      costPricePerCase,                   // also store case price for reference
      supplierId: supplierId || null,
      supplierName: supplierName || null,
      invoiceNumber: invoiceNumber || null,
      invoiceDate: invoiceDate || null,
      receivedAt: new Date()
    });

    // Update stock
    product.stock += totalUnits;

    // Update base cost price to latest per unit cost
    product.costPrice = costPricePerUnit;

    // Add supplier to product's suppliers list if not already there
    if (supplierId && !product.suppliers.includes(supplierId)) {
      product.suppliers.push(supplierId);
    }

    await product.save();
    res.json({ 
      product,
      summary: {
        totalUnits,
        costPricePerUnit,
        costPricePerCase,
        totalCost: totalUnits * costPricePerUnit
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product primary supplier
router.patch("/:id/suppliers", async (req, res) => {
  try {
    const { primarySupplier, suppliers } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (primarySupplier !== undefined)
      product.primarySupplier = primarySupplier;
    if (suppliers !== undefined) product.suppliers = suppliers;

    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restock a product
router.patch("/:id/restock", async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res
        .status(400)
        .json({ error: "Quantity must be a positive number" });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.stock += quantity;
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
