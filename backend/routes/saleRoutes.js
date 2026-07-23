const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// FIFO cost calculation
const calculateFIFOCost = async (product, unitsNeeded) => {
  let remainingUnits = unitsNeeded;
  let totalCost = 0;

  const lots = [...product.lots].sort(
    (a, b) => new Date(a.receivedAt) - new Date(b.receivedAt),
  );
  const updatedLots = [];

  for (const lot of lots) {
    if (remainingUnits <= 0) {
      updatedLots.push(lot);
      continue;
    }

    const costPerUnit =
      lot.costPrice ||
      (lot.costPricePerCase
        ? lot.costPricePerCase / (product.unitsPerCase || 1)
        : 0);

    if (lot.quantity <= remainingUnits) {
      totalCost += lot.quantity * costPerUnit;
      remainingUnits -= lot.quantity;
    } else {
      totalCost += remainingUnits * costPerUnit;
      updatedLots.push({
        ...lot._doc,
        quantity: lot.quantity - remainingUnits,
      });
      remainingUnits = 0;
    }
  }

  if (lots.length === 0) {
    const costPerUnit =
      product.costPrice ||
      (product.costPricePerCase
        ? product.costPricePerCase / (product.unitsPerCase || 1)
        : 0);
    totalCost = costPerUnit * unitsNeeded;
  }

  return { totalCost, updatedLots };
};

// Create sale
router.post("/", async (req, res) => {
  try {
    const { customerId, isWalkIn, items, notes, paymentStatus, amountPaid } =
      req.body;

    let customer = null;
    let customerName = "Walk-in Customer";
    let shopName = "—";

    if (isWalkIn) {
      if (req.body.walkInName) customerName = req.body.walkInName;
      if (req.body.walkInShop) shopName = req.body.walkInShop;
    } else {
      if (!customerId)
        return res.status(400).json({ error: "Customer required" });
      customer = await Customer.findOne({
        _id: customerId,
        ownerId: req.user.userId,
      });
      if (!customer)
        return res.status(404).json({ error: "Customer not found" });
      customerName = customer.name;
      shopName = customer.shopName;
    }

    let subtotal = 0;
    let totalDiscount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        ownerId: req.user.userId,
      });
      if (!product)
        return res
          .status(404)
          .json({ error: `Product not found: ${item.productId}` });

      const unitsPerCase = product.unitsPerCase || 1;
      const isFullCase = item.variantName === "Full Case";

      // Calculate units to deduct from stock
      const unitsToDeduct = isFullCase
        ? item.quantity * unitsPerCase
        : item.quantity;

      // Check stock
      if (product.stock < unitsToDeduct) {
        const casesLeft = Math.floor(product.stock / unitsPerCase);
        const looseLeft = product.stock % unitsPerCase;
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${casesLeft} cases + ${looseLeft} loose`,
        });
      }

      // FIFO cost based on units deducted
      const { totalCost: itemTotalCost, updatedLots } = await calculateFIFOCost(
        product,
        unitsToDeduct,
      );

      // Cost per unit for reference
      const costPerUnit = unitsToDeduct > 0 ? itemTotalCost / unitsToDeduct : 0;
      const costPerCase = costPerUnit * unitsPerCase;

      // Revenue
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
        variantQuantity: isFullCase ? unitsPerCase : 1,
        unitsDeducted: unitsToDeduct,
        quantity: item.quantity,
        costPrice: costPerUnit,
        costPricePerCase: isFullCase ? costPerCase : null,
        totalCostForItem: itemTotalCost,
        unitPrice: item.unitPrice,
        discountType: item.discountType || "flat",
        discountValue: item.discountValue || 0,
        discountAmount,
        totalPrice,
      });

      // Update stock and lots
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -unitsToDeduct },
          $set: { lots: updatedLots },
        },
        { returnDocument: "after" },
      );
    }

    // Final totals
    const totalAmount = subtotal - totalDiscount;
    const totalCost = processedItems.reduce(
      (sum, item) => sum + item.totalCostForItem,
      0,
    );
    const totalProfit = totalAmount - totalCost;

    // Payment
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

    // Update customer purchases
    if (!isWalkIn && customer) {
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalPurchases: totalAmount } },
        { returnDocument: "after" },
      );
    }

    // Payment history
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
      ownerId: req.user.userId,
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

// Add payment
router.patch("/:id/payment", async (req, res) => {
  try {
    const { amount, note } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Amount must be positive" });

    const sale = await Sale.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    if (sale.remainingAmount <= 0)
      return res.status(400).json({ error: "Bill already fully paid" });
    if (amount > sale.remainingAmount)
      return res.status(400).json({
        error: `Amount exceeds remaining balance of ₹${sale.remainingAmount}`,
      });

    sale.amountPaid += Number(amount);
    sale.remainingAmount -= Number(amount);

    if (sale.remainingAmount <= 0) {
      sale.paymentStatus = "paid";
      sale.remainingAmount = 0;
    } else {
      sale.paymentStatus = "partial";
    }

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

// Convert walk-in to customer
router.patch("/:id/convert", async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId)
      return res.status(400).json({ error: "Customer ID required" });

    const sale = await Sale.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    if (!sale.isWalkIn)
      return res.status(400).json({ error: "Sale already linked to customer" });

    const customer = await Customer.findOne({
      _id: customerId,
      ownerId: req.user.userId,
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    sale.customer = customer._id;
    sale.customerName = customer.name;
    sale.shopName = customer.shopName;
    sale.isWalkIn = false;
    await sale.save();

    await Customer.findByIdAndUpdate(customerId, {
      $inc: { totalPurchases: sale.totalAmount },
    });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sales
router.get("/", async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let filter = { ownerId: req.user.userId };

    if (status && status !== "all") filter.paymentStatus = status;
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

// Get single sale
router.get("/:id", async (req, res) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sales by customer
router.get("/customer/:customerId", async (req, res) => {
  try {
    const sales = await Sale.find({
      customer: req.params.customerId,
      ownerId: req.user.userId,
    }).sort({ createdAt: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reports summary
router.get("/reports/summary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { ownerId: req.user.userId };

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const sales = await Sale.find(filter);

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
      if (!monthlyMap[month])
        monthlyMap[month] = { revenue: 0, cost: 0, profit: 0, bills: 0 };
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
            totalUnitsDeducted: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
          };
        }
        const itemCost =
          item.totalCostForItem ||
          item.costPrice * (item.unitsDeducted || item.quantity);
        productMap[item.productName].totalQty += item.quantity;
        productMap[item.productName].totalUnitsDeducted +=
          item.unitsDeducted || 0;
        productMap[item.productName].totalRevenue += item.totalPrice;
        productMap[item.productName].totalCost += itemCost;
        productMap[item.productName].totalProfit += item.totalPrice - itemCost;
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
        const itemCost =
          item.totalCostForItem ||
          item.costPrice * (item.unitsDeducted || item.quantity);
        brandMap[item.brand].totalRevenue += item.totalPrice;
        brandMap[item.brand].totalCost += itemCost;
        brandMap[item.brand].totalProfit += item.totalPrice - itemCost;
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
