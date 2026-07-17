"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { productAPI, supplierAPI } from "../../lib/api";

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      padding: "20px",
      ...style,
    }}
  >
    {children}
  </div>
);

const Btn = ({
  children,
  onClick,
  color = "var(--accent)",
  style = {},
  disabled = false,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: color,
      color: "white",
      padding: "6px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontWeight: "500",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}
  >
    {children}
  </button>
);

const Input = ({ style = {}, ...props }) => (
  <input
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      color: "var(--text)",
      borderRadius: "8px",
      padding: "8px 12px",
      fontSize: "13px",
      outline: "none",
      width: "100%",
      ...style,
    }}
    {...props}
  />
);

export default function AlertsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [restockForm, setRestockForm] = useState({
    quantity: "",
    unit: "cases",
    costPrice: "",
    supplierId: "",
    invoiceNumber: "",
    invoiceDate: "",
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };
  const fetchSuppliers = async () => {
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  const handleRestock = async () => {
    if (!restockForm.quantity || Number(restockForm.quantity) <= 0) {
      alert("Enter valid quantity");
      return;
    }
    if (!restockForm.costPrice || Number(restockForm.costPrice) <= 0) {
      alert("Enter purchase price");
      return;
    }

    const selectedSupplier = suppliers.find(
      (s) => s._id === restockForm.supplierId,
    );

    try {
      await productAPI.receive(restockModal._id, {
        quantity: Number(restockForm.quantity),
        unit: restockForm.unit,
        costPrice: Number(restockForm.costPrice),
        supplierId: restockForm.supplierId || null,
        supplierName: selectedSupplier?.name || null,
        invoiceNumber: restockForm.invoiceNumber || null,
        invoiceDate: restockForm.invoiceDate || null,
      });
      setRestockModal(null);
      setRestockForm({
        quantity: "",
        unit: "cases",
        costPrice: product.costPricePerCase || product.costPrice || "",
        supplierId: product.primarySupplier || "",
        invoiceNumber: "",
        invoiceDate: new Date().toISOString().split("T")[0],
      });
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const getStockDisplay = (product) => {
    const upc = product.unitsPerCase || 1;
    const cases = Math.floor(product.stock / upc);
    const loose = product.stock % upc;
    const thresholdCases = Math.floor(product.reorderThreshold / upc);
    return { cases, loose, thresholdCases };
  };

  const getStockLevel = (product) => {
    if (product.stock === 0) return "out";
    if (product.stock <= product.reorderThreshold * 0.5) return "critical";
    if (product.stock <= product.reorderThreshold) return "low";
    return "ok";
  };

  const outOfStock = products.filter((p) => p.stock === 0);
  const criticalStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.reorderThreshold * 0.5,
  );
  const lowStock = products.filter(
    (p) => p.stock > p.reorderThreshold * 0.5 && p.stock <= p.reorderThreshold,
  );
  const okStock = products.filter((p) => p.stock > p.reorderThreshold);

  const filteredProducts =
    filter === "out"
      ? outOfStock
      : filter === "critical"
        ? criticalStock
        : filter === "low"
          ? lowStock
          : [...outOfStock, ...criticalStock, ...lowStock];

  const levelConfig = {
    out: {
      color: "var(--danger)",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      label: "Out of Stock",
    },
    critical: {
      color: "#F97316",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.2)",
      label: "Critical",
    },
    low: {
      color: "var(--warning)",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      label: "Low Stock",
    },
  };

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Stock Alerts</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            Products that need your attention
          </p>
        </div>
        <Link
          href="/products"
          style={{
            background: "var(--accent)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          View Full Inventory
        </Link>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        {[
          {
            label: "Out of Stock",
            value: outOfStock.length,
            color: "var(--danger)",
            bg: "rgba(239,68,68,0.08)",
            border: "rgba(239,68,68,0.2)",
            filter: "out",
          },
          {
            label: "Critical",
            value: criticalStock.length,
            color: "#F97316",
            bg: "rgba(249,115,22,0.08)",
            border: "rgba(249,115,22,0.2)",
            filter: "critical",
          },
          {
            label: "Low Stock",
            value: lowStock.length,
            color: "var(--warning)",
            bg: "rgba(245,158,11,0.08)",
            border: "rgba(245,158,11,0.2)",
            filter: "low",
          },
          {
            label: "All Good",
            value: okStock.length,
            color: "var(--success)",
            bg: "rgba(34,197,94,0.08)",
            border: "rgba(34,197,94,0.2)",
            filter: "ok",
          },
        ].map((card) => (
          <div
            key={card.label}
            onClick={() =>
              setFilter(filter === card.filter ? "all" : card.filter)
            }
            style={{
              background: card.bg,
              border: `1px solid ${filter === card.filter ? card.color : card.border}`,
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            <p
              style={{
                color: card.color,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              {card.label}
            </p>
            <p
              style={{ fontSize: "32px", fontWeight: "700", color: card.color }}
            >
              {card.value}
            </p>
            <p
              style={{
                color: card.color,
                fontSize: "12px",
                marginTop: "4px",
                opacity: 0.7,
              }}
            >
              products
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { value: "all", label: "All Alerts" },
          { value: "out", label: "Out of Stock" },
          { value: "critical", label: "Critical" },
          { value: "low", label: "Low Stock" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              background:
                filter === opt.value ? "var(--accent)" : "transparent",
              color: filter === opt.value ? "white" : "var(--text-muted)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredProducts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>✅</p>
          <p
            style={{ fontWeight: "600", fontSize: "16px", marginBottom: "8px" }}
          >
            All good!
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
            No stock alerts for the selected filter
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredProducts.map((product) => {
            const level = getStockLevel(product);
            const config = levelConfig[level];
            const { cases, loose, thresholdCases } = getStockDisplay(product);

            return (
              <div
                key={product._id}
                style={{
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: config.bg,
                      border: `2px solid ${config.color}`,
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    {level === "out"
                      ? "🚫"
                      : level === "critical"
                        ? "⚠️"
                        : "📉"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                        marginBottom: "2px",
                      }}
                    >
                      <p style={{ fontWeight: "600", fontSize: "14px" }}>
                        {product.name}
                      </p>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: `${config.color}20`,
                          color: config.color,
                          border: `1px solid ${config.color}30`,
                          fontWeight: "600",
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {product.brand} · {product.category || "No category"}
                    </p>
                  </div>
                </div>

                {/* Stock Info */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      padding: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: config.color,
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Current Stock
                    </p>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: config.color,
                      }}
                    >
                      {product.soldLoose
                        ? `${cases}c + ${loose}u`
                        : `${cases} cases`}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {product.stock} units
                    </p>
                  </div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "8px",
                      padding: "8px",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: "2px",
                      }}
                    >
                      Threshold
                    </p>
                    <p style={{ fontSize: "13px", fontWeight: "600" }}>
                      {thresholdCases} cases
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {product.reorderThreshold} units
                    </p>
                  </div>
                </div>

                {/* Restock Button */}
                <Btn
                  onClick={() => {
                    setRestockModal(product);
                    setRestockForm({
                      quantity: "",
                      unit: "cases",
                      costPrice: product.costPrice || "",
                      supplierId: product.primarySupplier || "",
                      invoiceNumber: "",
                      invoiceDate: new Date().toISOString().split("T")[0],
                    });
                  }}
                  color={config.color}
                  style={{ width: "100%", padding: "10px", fontSize: "13px" }}
                >
                  + Restock Now
                </Btn>
              </div>
            );
          })}
        </div>
      )}

      {/* All Good Products Summary */}
      {filter === "all" && okStock.length > 0 && (
        <Card>
          <p
            style={{
              fontWeight: "600",
              fontSize: "14px",
              marginBottom: "12px",
              color: "var(--success)",
            }}
          >
            ✅ Products with Good Stock ({okStock.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {okStock.map((p) => (
              <span
                key={p._id}
                style={{
                  background: "rgba(34,197,94,0.08)",
                  color: "var(--success)",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                {p.name} — {p.stock} units
              </span>
            ))}
          </div>
        </Card>
      )}
      {/* Restock Modal */}
      {restockModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <p style={{ fontWeight: "700", fontSize: "16px" }}>
                  Restock Product
                </p>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "13px",
                    marginTop: "2px",
                  }}
                >
                  {restockModal.name} · {restockModal.brand}
                </p>
              </div>
              <button
                onClick={() => setRestockModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Current Stock */}
            <div
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                gap: "24px",
                fontSize: "13px",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Current Stock
                </p>
                <p style={{ fontWeight: "600", color: "var(--danger)" }}>
                  {restockModal.stock} units
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Last Cost Price
                </p>
                <p style={{ fontWeight: "600" }}>
                  ₹{restockModal.costPrice || 0} per unit
                </p>
              </div>
              <div>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Units per Case
                </p>
                <p style={{ fontWeight: "600" }}>
                  {restockModal.unitsPerCase || 1}
                </p>
              </div>
            </div>

            {/* Form */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* Quantity + Unit */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 120px",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 10"
                    value={restockForm.quantity}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        quantity: e.target.value,
                      })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                    }}
                    min="1"
                    autoFocus
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Unit
                  </label>
                  <select
                    value={restockForm.unit}
                    onChange={(e) =>
                      setRestockForm({ ...restockForm, unit: e.target.value })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                    }}
                  >
                    <option value="cases">Cases</option>
                    <option value="units">Units</option>
                  </select>
                </div>
              </div>

              {restockForm.quantity && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--accent)",
                    marginTop: "-8px",
                  }}
                >
                  ={" "}
                  {restockForm.unit === "cases"
                    ? Number(restockForm.quantity) *
                      (restockModal.unitsPerCase || 1)
                    : Number(restockForm.quantity)}{" "}
                  units will be added
                </p>
              )}

              {/* Purchase Price */}
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Purchase Price{" "}
                  {restockForm.unit === "cases"
                    ? "per Case (₹)"
                    : "per Unit (₹)"}{" "}
                  *
                </label>
                <input
                  type="number"
                  placeholder={
                    restockForm.unit === "cases"
                      ? `e.g. ₹${((restockModal.costPrice || 0) * (restockModal.unitsPerCase || 1)).toFixed(2)} per case`
                      : `Last: ₹${restockModal.costPrice || 0} per unit`
                  }
                  value={restockForm.costPrice}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      costPrice: e.target.value,
                    })
                  }
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    outline: "none",
                    width: "100%",
                  }}
                  min="0"
                />
                {restockForm.costPrice && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--accent)",
                      marginTop: "4px",
                    }}
                  >
                    Per unit cost = ₹
                    {restockForm.unit === "cases"
                      ? (
                          Number(restockForm.costPrice) /
                          (restockModal.unitsPerCase || 1)
                        ).toFixed(2)
                      : Number(restockForm.costPrice).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Supplier */}
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                    display: "block",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Supplier
                </label>
                <select
                  value={restockForm.supplierId}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      supplierId: e.target.value,
                    })
                  }
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    outline: "none",
                    width: "100%",
                  }}
                >
                  <option value="">Select supplier (optional)</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                      {s.city ? ` — ${s.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Invoice Number
                  </label>
                  <input
                    placeholder="e.g. INV-2024-001"
                    value={restockForm.invoiceNumber}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                      display: "block",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={restockForm.invoiceDate}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        invoiceDate: e.target.value,
                      })
                    }
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>
              </div>

              {/* Total Cost Preview */}
              {restockForm.quantity && restockForm.costPrice && (
                <div
                  style={{
                    background: "rgba(99,102,241,0.08)",
                    border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total Purchase Cost
                  </p>
                  <p
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "var(--accent)",
                    }}
                  >
                    ₹
                    {(
                      (restockForm.unit === "cases"
                        ? Number(restockForm.quantity) *
                          (restockModal.unitsPerCase || 1)
                        : Number(restockForm.quantity)) *
                      (restockForm.unit === "cases"
                        ? Number(restockForm.costPrice) /
                          (restockModal.unitsPerCase || 1)
                        : Number(restockForm.costPrice))
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <button
                onClick={handleRestock}
                style={{
                  flex: 1,
                  background: "var(--success)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Confirm Restock
              </button>
              <button
                onClick={() => setRestockModal(null)}
                style={{
                  flex: 1,
                  background: "var(--border)",
                  color: "var(--text)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
