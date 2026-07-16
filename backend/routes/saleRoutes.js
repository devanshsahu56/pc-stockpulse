const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// FIFO cost calculation helper
const calculateFIFOCost = async (product, unitsNeeded) => {
  let remainingUnits = unitsNeeded;
  let totalCost = 0;

  // Sort lots by oldest first
  const lots = [...product.lots].sort(
    (a, b) => new Date(a.receivedAt) - new Date(b.receivedAt),
  );

  const updatedLots = [];

  for (const lot of lots) {
    if (remainingUnits <= 0) {
      updatedLots.push(lot);
      continue;
    }

    if (lot.quantity <= remainingUnits) {
      totalCost += lot.quantity * lot.costPrice;
      remainingUnits -= lot.quantity;
    } else {
      totalCost += remainingUnits * lot.costPrice;
      updatedLots.push({
        ...lot._doc,
        quantity: lot.quantity - remainingUnits,
      });
      remainingUnits = 0;
    }
  }

  // Fallback if no lots exist
  if (lots.length === 0) {
    totalCost = product.costPrice * unitsNeeded;
  }

  return { totalCost, updatedLots };
};

// Create a new sale
router.post("/", async (req, res) => {
  try {
    const { customerId, isWalkIn, items, notes, paymentStatus, amountPaid } =
      req.body;

    let customer = null;
    let customerName = "Walk-in Customer";
    let shopName = "—";

    if (!isWalkIn) {
      if (!customerId)
        return res
          .status(400)
          .json({ error: "Customer is required for non walk-in sales" });
      customer = await Customer.findById(customerId);
      if (!customer)
        return res.status(404).json({ error: "Customer not found" });
      customerName = customer.name;
      shopName = customer.shopName;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ error: `Product not found: ${item.productId}` });
      }

      let unitsToDeduct = item.quantity;
      if (item.variantName === "Full Case") {
        unitsToDeduct =
          item.quantity * (item.variantQuantity || product.unitsPerCase);
      }

      if (product.stock < unitsToDeduct) {
        const casesLeft = Math.floor(product.stock / product.unitsPerCase);
        const looseLeft = product.stock % product.unitsPerCase;
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${casesLeft} cases + ${looseLeft} loose`,
        });
      }

      const { totalCost: itemCost, updatedLots } = await calculateFIFOCost(
        product,
        unitsToDeduct,
      );
      const costPerUnit =
        unitsToDeduct > 0 ? itemCost / unitsToDeduct : product.costPrice;

      const lineTotal = item.unitPrice * item.quantity;
      let discountAmount = 0;
      if (item.discountType === "percentage") {
        discountAmount = (lineTotal * item.discountValue) / 100;
      } else {
        discountAmount = item.discountValue || 0;
      }

      const totalPrice = lineTotal - discountAmount;
      subtotal += lineTotal;
      totalDiscount += discountAmount;

      processedItems.push({
        product: product._id,
        productName: product.name,
        brand: product.brand,
        variantName: item.variantName || "Loose",
        variantQuantity: item.variantQuantity || 1,
        quantity: item.quantity,
        costPrice: costPerUnit,
        unitPrice: item.unitPrice,
        discountType: item.discountType || "flat",
        discountValue: item.discountValue || 0,
        discountAmount,
        totalPrice,
      });

      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -unitsToDeduct }, $set: { lots: updatedLots } },
        { returnDocument: "after" },
      );
    }

    const totalAmount = subtotal - totalDiscount;
    const totalCost = processedItems.reduce(
      (sum, item) => sum + item.costPrice * item.quantity,
      0,
    );
    const totalProfit = totalAmount - totalCost;

    let finalAmountPaid = 0;
    let remainingAmount = 0;
    let finalPaymentStatus = paymentStatus || "paid";

    if (finalPaymentStatus === "paid") {
      finalAmountPaid = totalAmount;
      remainingAmount = 0;
    } else if (finalPaymentStatus === "unpaid") {
      finalAmountPaid = 0;
      remainingAmount = totalAmount;
    } else if (finalPaymentStatus === "partial") {
      finalAmountPaid = Number(amountPaid) || 0;
      remainingAmount = totalAmount - finalAmountPaid;
    }

    // Only update customer total purchases for registered customers
    if (!isWalkIn && customer) {
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalPurchases: totalAmount } },
        { returnDocument: "after" },
      );
    }

    const paymentHistory = [];
    if (finalAmountPaid > 0) {
      paymentHistory.push({
        amount: finalAmountPaid,
        date: new Date(),
        note:
          finalPaymentStatus === "paid"
            ? "Full payment"
            : "Initial partial payment",
      });
    }

    const sale = new Sale({
      customer: isWalkIn ? null : customer._id,
      customerName,
      shopName,
      isWalkIn: isWalkIn || false,
      items: processedItems,
      subtotal,
      totalDiscount,
      totalCost,
      totalProfit,
      totalAmount,
      amountPaid: finalAmountPaid,
      remainingAmount,
      paymentStatus: finalPaymentStatus,
      paymentHistory,
      notes,
    });

    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Convert walk-in sale to registered customer
router.patch("/:id/convert", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId)
      return res.status(400).json({ error: "Customer ID required" });

    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    if (!sale.isWalkIn)
      return res
        .status(400)
        .json({ error: "Sale is already linked to a customer" });

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Update sale
    sale.customer = customer._id;
    sale.customerName = customer.name;
    sale.shopName = customer.shopName;
    sale.isWalkIn = false;
    await sale.save();

    // Update customer total purchases
    await Customer.findByIdAndUpdate(
      customerId,
      { $inc: { totalPurchases: sale.totalAmount } },
      { returnDocument: "after" },
    );

    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a payment against an existing bill
router.patch("/:id/payment", async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a positive number" });
    }

    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });

    if (sale.remainingAmount <= 0) {
      return res.status(400).json({ error: "This bill is already fully paid" });
    }

    if (amount > sale.remainingAmount) {
      return res.status(400).json({
        error: `Amount exceeds remaining balance of ₹${sale.remainingAmount}`,
      });
    }

    // Update payment fields
    sale.amountPaid += Number(amount);
    sale.remainingAmount -= Number(amount);

    // Update status
    if (sale.remainingAmount <= 0) {
      sale.paymentStatus = "paid";
      sale.remainingAmount = 0;
    } else {
      sale.paymentStatus = "partial";
    }

    // Add to payment history
    sale.paymentHistory.push({
      amount: Number(amount),
      date: new Date(),
      note: note || "Payment received",
    });

    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales (newest first)
router.get("/", async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let filter = {};

    if (status && status !== "all") {
      filter.paymentStatus = status;
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single sale by ID
router.get("/:id", async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales for a specific customer
router.get("/customer/:customerId", async (req, res) => {
  try {
    const sales = await Sale.find({ customer: req.params.customerId }).sort({
      createdAt: -1,
    });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reports endpoint
router.get("/reports/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const sales = await Sale.find(filter);

    // Overall summary
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + s.totalDiscount, 0);
    const totalCollected = sales.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalPending = sales.reduce((sum, s) => sum + s.remainingAmount, 0);
    const profitMargin =
      totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Monthly breakdown
    const monthlyMap = {};
    sales.forEach((sale) => {
      const month = new Date(sale.createdAt).toLocaleString("en-IN", {
        month: "short",
        year: "numeric",
      });
      if (!monthlyMap[month]) {
        monthlyMap[month] = { revenue: 0, cost: 0, profit: 0, bills: 0 };
      }
      monthlyMap[month].revenue += sale.totalAmount;
      monthlyMap[month].cost += sale.totalCost || 0;
      monthlyMap[month].profit += sale.totalProfit || 0;
      monthlyMap[month].bills += 1;
    });

    // Product wise breakdown
    const productMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productMap[item.productName]) {
          productMap[item.productName] = {
            productName: item.productName,
            brand: item.brand,
            totalQty: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          };
        }
        productMap[item.productName].totalQty += item.quantity;
        productMap[item.productName].totalRevenue += item.totalPrice;
        productMap[item.productName].totalCost +=
          (item.costPrice || 0) * item.quantity;
        productMap[item.productName].totalProfit +=
          item.totalPrice - (item.costPrice || 0) * item.quantity;
      });
    });

    // Brand wise breakdown
    const brandMap = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!brandMap[item.brand]) {
          brandMap[item.brand] = {
            brand: item.brand,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            totalQty: 0,
          };
        }
        brandMap[item.brand].totalRevenue += item.totalPrice;
        brandMap[item.brand].totalCost += (item.costPrice || 0) * item.quantity;
        brandMap[item.brand].totalProfit +=
          item.totalPrice - (item.costPrice || 0) * item.quantity;
        brandMap[item.brand].totalQty += item.quantity;
      });
    });

    res.json({
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        totalDiscount,
        totalCollected,
        totalPending,
        profitMargin,
        totalBills: sales.length,
      },
      monthly: Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        ...data,
      })),
      products: Object.values(productMap).sort(
        (a, b) => b.totalProfit - a.totalProfit,
      ),
      brands: Object.values(brandMap).sort(
        (a, b) => b.totalProfit - a.totalProfit,
      ),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
