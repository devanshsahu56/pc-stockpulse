"use client";
import React, { useState, useEffect } from "react";
import { saleAPI } from "../../lib/api";

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

const statusColors = {
  paid: "var(--success)",
  unpaid: "var(--danger)",
  partial: "var(--warning)",
};

const StatCard = ({ label, value, color = "var(--text)" }) => (
  <Card>
    <p
      style={{
        color: "var(--text-muted)",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "8px",
      }}
    >
      {label}
    </p>
    <p style={{ fontSize: "24px", fontWeight: "700", color }}>{value}</p>
  </Card>
);

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSale, setExpandedSale] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [convertModal, setConvertModal] = useState(null);
  const [convertSearch, setConvertSearch] = useState("");
  const [convertResults, setConvertResults] = useState([]);

  useEffect(() => {
    fetchSales();
  }, [statusFilter, dateFilter, startDate, endDate]);

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        startDate: start.toISOString(),
        endDate: new Date().toISOString(),
      };
    }
    if (dateFilter === "month") {
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: new Date().toISOString(),
      };
    }
    if (dateFilter === "year") {
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
        endDate: new Date().toISOString(),
      };
    }
    if (dateFilter === "custom" && startDate && endDate)
      return { startDate, endDate };
    return {};
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const range = getDateRange();
      if (range.startDate) params.startDate = range.startDate;
      if (range.endDate) params.endDate = range.endDate;
      const res = await saleAPI.getAll(params);
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Enter valid amount");
      return;
    }
    setPaymentLoading(true);
    try {
      await saleAPI.addPayment(paymentModal._id, {
        amount: Number(paymentAmount),
        note: paymentNote || "Payment received",
      });
      setPaymentModal(null);
      setPaymentAmount("");
      setPaymentNote("");
      fetchSales();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
    setPaymentLoading(false);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCollected = sales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalPending = sales.reduce((sum, s) => sum + s.remainingAmount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Sales History</h1>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        <StatCard
          label="Total Bills"
          value={sales.length}
          color="var(--accent)"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
        />
        <StatCard
          label="Collected"
          value={`₹${totalCollected.toLocaleString()}`}
          color="var(--success)"
        />
        <StatCard
          label="Pending"
          value={`₹${totalPending.toLocaleString()}`}
          color="var(--danger)"
        />
      </div>

      {/* Filters */}
      <Card>
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px",flexWrap: 'wrap' }}>
          {["all", "paid", "partial", "unpaid"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                textTransform: "capitalize",
                background:
                  statusFilter === s
                    ? statusColors[s] || "var(--accent)"
                    : "var(--border)",
                color: "white",
              }}
            >
              {s === "all" ? "All Bills" : s}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "8px",
          }}
        >
          Date Range
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {[
            { value: "all", label: "All Time" },
            { value: "today", label: "Today" },
            { value: "week", label: "This Week" },
            { value: "month", label: "This Month" },
            { value: "year", label: "This Year" },
            { value: "custom", label: "Custom" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                fontSize: "12px",
                background:
                  dateFilter === opt.value ? "var(--accent)" : "transparent",
                color: dateFilter === opt.value ? "white" : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateFilter === "custom" && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "12px",
              alignItems: "flex-end",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                From
              </p>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: "160px" }}
              />
            </div>
            <div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                To
              </p>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: "160px" }}
              />
            </div>
            <Btn onClick={fetchSales}>Apply</Btn>
          </div>
        )}
      </Card>

      {/* Sales Table */}
      {loading ? (
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "40px",
          }}
        >
          Loading...
        </p>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {/* Desktop Table */}
          <div className="desktop-links">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    "Date",
                    "Customer",
                    "Items",
                    "Total",
                    "Paid",
                    "Remaining",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No sales found
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <React.Fragment key={sale._id}>
                      <tr
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--surface-2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <p style={{ fontSize: "13px", fontWeight: "500" }}>
                            {new Date(sale.createdAt).toLocaleDateString(
                              "en-IN",
                            )}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {new Date(sale.createdAt).toLocaleTimeString(
                              "en-IN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <p style={{ fontSize: "13px", fontWeight: "500" }}>
                              {sale.customerName}
                            </p>
                            {sale.isWalkIn && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: "rgba(245,158,11,0.1)",
                                  color: "var(--warning)",
                                  border: "1px solid rgba(245,158,11,0.2)",
                                  fontWeight: "600",
                                }}
                              >
                                Walk-in
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {sale.shopName}
                          </p>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {sale.items.length} item(s)
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          ₹{sale.totalAmount.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            color: "var(--success)",
                            fontWeight: "500",
                          }}
                        >
                          ₹{sale.amountPaid.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: "13px",
                            color: "var(--danger)",
                            fontWeight: "500",
                          }}
                        >
                          {sale.remainingAmount > 0
                            ? `₹${sale.remainingAmount.toLocaleString()}`
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: `${statusColors[sale.paymentStatus]}18`,
                              color: statusColors[sale.paymentStatus],
                              border: `1px solid ${statusColors[sale.paymentStatus]}30`,
                              fontWeight: "500",
                              textTransform: "capitalize",
                            }}
                          >
                            {sale.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() =>
                                setExpandedSale(
                                  expandedSale === sale._id ? null : sale._id,
                                )
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--accent)",
                                fontSize: "12px",
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              {expandedSale === sale._id ? "Hide" : "View"}
                            </button>
                            {sale.paymentStatus !== "paid" && (
                              <Btn
                                onClick={() => {
                                  setPaymentModal(sale);
                                  setPaymentAmount("");
                                  setPaymentNote("");
                                }}
                                color="var(--success)"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                              >
                                + Pay
                              </Btn>
                            )}
                            {sale.isWalkIn && (
                              <Btn
                                onClick={() => setConvertModal(sale)}
                                color="var(--accent)"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                              >
                                Convert
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedSale === sale._id && (
                        <tr
                          style={{
                            background: "var(--surface-2)",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <td colSpan="8" style={{ padding: "16px 24px" }}>
                            <table
                              style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                marginBottom: "12px",
                              }}
                            >
                              <thead>
                                <tr>
                                  {[
                                    "Product",
                                    "Variant",
                                    "Qty",
                                    "Price",
                                    "Discount",
                                    "Total",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      style={{
                                        padding: "6px 8px",
                                        textAlign:
                                          h === "Product" || h === "Variant"
                                            ? "left"
                                            : "right",
                                        fontSize: "11px",
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map((item, i) => (
                                  <tr
                                    key={i}
                                    style={{
                                      borderTop: "1px solid var(--border)",
                                    }}
                                  >
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                      }}
                                    >
                                      <p>{item.productName}</p>
                                      <p
                                        style={{
                                          fontSize: "11px",
                                          color: "var(--text-muted)",
                                        }}
                                      >
                                        {item.brand}
                                      </p>
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {item.variantName}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                        textAlign: "right",
                                      }}
                                    >
                                      {item.quantity}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                        textAlign: "right",
                                      }}
                                    >
                                      ₹{item.unitPrice}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                        textAlign: "right",
                                        color: "var(--danger)",
                                      }}
                                    >
                                      {item.discountAmount > 0
                                        ? `- ₹${item.discountAmount.toFixed(2)}`
                                        : "—"}
                                    </td>
                                    <td
                                      style={{
                                        padding: "8px",
                                        fontSize: "13px",
                                        textAlign: "right",
                                        fontWeight: "600",
                                      }}
                                    >
                                      ₹{item.totalPrice.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div
                              style={{
                                display: "flex",
                                gap: "24px",
                                fontSize: "13px",
                                marginBottom: "12px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span style={{ color: "var(--text-muted)" }}>
                                Subtotal:{" "}
                                <strong style={{ color: "var(--text)" }}>
                                  ₹{sale.subtotal.toLocaleString()}
                                </strong>
                              </span>
                              {sale.totalDiscount > 0 && (
                                <span style={{ color: "var(--danger)" }}>
                                  Discount: - ₹{sale.totalDiscount.toFixed(2)}
                                </span>
                              )}
                              <span style={{ color: "var(--text-muted)" }}>
                                Total:{" "}
                                <strong style={{ color: "var(--text)" }}>
                                  ₹{sale.totalAmount.toLocaleString()}
                                </strong>
                              </span>
                              <span style={{ color: "var(--success)" }}>
                                Paid: ₹{sale.amountPaid.toLocaleString()}
                              </span>
                              {sale.remainingAmount > 0 && (
                                <span style={{ color: "var(--danger)" }}>
                                  Remaining: ₹
                                  {sale.remainingAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                            {sale.paymentHistory?.length > 0 && (
                              <div>
                                <p
                                  style={{
                                    fontSize: "11px",
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    marginBottom: "8px",
                                  }}
                                >
                                  Payment History
                                </p>
                                {sale.paymentHistory.map((p, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      padding: "6px 0",
                                      borderTop: "1px solid var(--border)",
                                      fontSize: "13px",
                                    }}
                                  >
                                    <span
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {new Date(p.date).toLocaleDateString(
                                        "en-IN",
                                      )}
                                    </span>
                                    <span
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {p.note}
                                    </span>
                                    <span
                                      style={{
                                        color: "var(--success)",
                                        fontWeight: "600",
                                      }}
                                    >
                                      ₹{p.amount.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {sale.notes && (
                              <p
                                style={{
                                  color: "var(--text-muted)",
                                  fontSize: "12px",
                                  marginTop: "8px",
                                }}
                              >
                                Notes: {sale.notes}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div
            className="mobile-only"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {sales.length === 0 ? (
              <p
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No sales found
              </p>
            ) : (
              sales.map((sale) => (
                <div
                  key={sale._id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Sale Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "2px",
                        }}
                      >
                        <p style={{ fontWeight: "600", fontSize: "14px" }}>
                          {sale.customerName}
                        </p>
                        {sale.isWalkIn && (
                          <span
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "rgba(245,158,11,0.1)",
                              color: "var(--warning)",
                              border: "1px solid rgba(245,158,11,0.2)",
                              fontWeight: "600",
                            }}
                          >
                            Walk-in
                          </span>
                        )}
                      </div>
                      <p
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {new Date(sale.createdAt).toLocaleDateString("en-IN")} ·{" "}
                        {sale.items.length} item(s)
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: `${statusColors[sale.paymentStatus]}18`,
                        color: statusColors[sale.paymentStatus],
                        border: `1px solid ${statusColors[sale.paymentStatus]}30`,
                        fontWeight: "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {sale.paymentStatus}
                    </span>
                  </div>

                  {/* Amount Row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        background: "var(--surface-2)",
                        borderRadius: "8px",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        Total
                      </p>
                      <p style={{ fontSize: "13px", fontWeight: "700" }}>
                        ₹{sale.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        background: "var(--surface-2)",
                        borderRadius: "8px",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        Paid
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "var(--success)",
                        }}
                      >
                        ₹{sale.amountPaid.toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        background: "var(--surface-2)",
                        borderRadius: "8px",
                        padding: "8px",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginBottom: "2px",
                        }}
                      >
                        Due
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          fontWeight: "700",
                          color:
                            sale.remainingAmount > 0
                              ? "var(--danger)"
                              : "var(--text-muted)",
                        }}
                      >
                        {sale.remainingAmount > 0
                          ? `₹${sale.remainingAmount.toLocaleString()}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        sale.paymentStatus !== "paid" ? "1fr 1fr" : "1fr",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        setExpandedSale(
                          expandedSale === sale._id ? null : sale._id,
                        )
                      }
                      style={{
                        background: "var(--border)",
                        color: "var(--text)",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      {expandedSale === sale._id
                        ? "Hide Details"
                        : "👁 View Details"}
                    </button>
                    {sale.paymentStatus !== "paid" && (
                      <button
                        onClick={() => {
                          setPaymentModal(sale);
                          setPaymentAmount("");
                          setPaymentNote("");
                        }}
                        style={{
                          background: "var(--success)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500",
                        }}
                      >
                        💰 Add Payment
                      </button>
                    )}
                    {sale.isWalkIn && (
                      <button
                        onClick={() => setConvertModal(sale)}
                        style={{
                          gridColumn: "span 2",
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px",
                          fontSize: "12px",
                          cursor: "pointer",
                          fontWeight: "500",
                          marginTop: "4px",
                        }}
                      >
                        🔄 Convert to Customer
                      </button>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedSale === sale._id && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "var(--surface-2)",
                        borderRadius: "8px",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          marginBottom: "8px",
                        }}
                      >
                        Items
                      </p>
                      {sale.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "6px 0",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "13px",
                          }}
                        >
                          <div>
                            <p style={{ fontWeight: "500" }}>
                              {item.productName}
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {item.variantName} × {item.quantity} @ ₹
                              {item.unitPrice}
                            </p>
                          </div>
                          <p style={{ fontWeight: "600" }}>
                            ₹{item.totalPrice.toLocaleString()}
                          </p>
                        </div>
                      ))}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginTop: "8px",
                          fontSize: "14px",
                          fontWeight: "700",
                        }}
                      >
                        <span>Total</span>
                        <span style={{ color: "var(--success)" }}>
                          ₹{sale.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {sale.paymentHistory?.length > 0 && (
                        <div style={{ marginTop: "10px" }}>
                          <p
                            style={{
                              fontWeight: "600",
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              marginBottom: "6px",
                            }}
                          >
                            Payments
                          </p>
                          {sale.paymentHistory.map((p, i) => (
                            <div
                              key={i}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "12px",
                                padding: "4px 0",
                              }}
                            >
                              <span style={{ color: "var(--text-muted)" }}>
                                {new Date(p.date).toLocaleDateString("en-IN")} ·{" "}
                                {p.note}
                              </span>
                              <span
                                style={{
                                  color: "var(--success)",
                                  fontWeight: "600",
                                }}
                              >
                                ₹{p.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {sale.notes && (
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "12px",
                            marginTop: "8px",
                          }}
                        >
                          Notes: {sale.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Payment Modal */}
      {paymentModal && (
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
          <Card style={{ width: '100%', maxWidth: '420px', margin: '0 12px' }}>
            <p
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "4px",
              }}
            >
              Add Payment
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              {paymentModal.customerName} — {paymentModal.shopName}
            </p>
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "16px",
              }}
            >
              {[
                {
                  label: "Total",
                  value: `₹${paymentModal.totalAmount.toLocaleString()}`,
                  color: "var(--text)",
                },
                {
                  label: "Paid",
                  value: `₹${paymentModal.amountPaid.toLocaleString()}`,
                  color: "var(--success)",
                },
                {
                  label: "Remaining",
                  value: `₹${paymentModal.remainingAmount.toLocaleString()}`,
                  color: "var(--danger)",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    {row.label}
                  </span>
                  <span style={{ fontWeight: "600", color: row.color }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Amount (₹)
              </label>
              <Input
                type="number"
                placeholder={`Max ₹${paymentModal.remainingAmount}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                autoFocus
              />
              {paymentAmount && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Remaining after: ₹
                  {Math.max(
                    0,
                    paymentModal.remainingAmount - Number(paymentAmount),
                  ).toLocaleString()}
                </p>
              )}
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                }}
              >
                Note
              </label>
              <Input
                placeholder="e.g. Cash, UPI..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn
                onClick={handleAddPayment}
                disabled={paymentLoading}
                color="var(--success)"
                style={{ flex: 1 }}
              >
                {paymentLoading ? "Saving..." : "Confirm"}
              </Btn>
              <Btn
                onClick={() => setPaymentModal(null)}
                color="var(--border)"
                style={{ flex: 1, color: "var(--text)" }}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
      )}
      {/* Convert Walk-in Modal */}
      {convertModal && (
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
          <Card style={{ width: "100%", maxWidth: "420px" }}>
            <p
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "4px",
              }}
            >
              Convert to Registered Customer
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              Bill from{" "}
              {new Date(convertModal.createdAt).toLocaleDateString("en-IN")} · ₹
              {convertModal.totalAmount.toLocaleString()}
            </p>

            <div style={{ position: "relative", marginBottom: "16px" }}>
              <Input
                placeholder="Search customer..."
                value={convertSearch}
                onChange={async (e) => {
                  setConvertSearch(e.target.value);
                  if (!e.target.value.trim()) {
                    setConvertResults([]);
                    return;
                  }
                  try {
                    const res = await customerAPI.search(e.target.value);
                    setConvertResults(res.data);
                  } catch (err) {
                    console.error(err);
                  }
                }}
                autoFocus
              />
              {convertResults.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 10,
                    width: "100%",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    marginTop: "4px",
                    overflow: "hidden",
                  }}
                >
                  {convertResults.map((c) => (
                    <div
                      key={c._id}
                      onClick={async () => {
                        try {
                          await saleAPI.convertToCustomer(
                            convertModal._id,
                            c._id,
                          );
                          setConvertModal(null);
                          setConvertSearch("");
                          setConvertResults([]);
                          fetchSales();
                        } catch (err) {
                          alert(
                            err.response?.data?.error || "Error converting",
                          );
                        }
                      }}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <p style={{ fontWeight: "500", fontSize: "13px" }}>
                        {c.name}
                      </p>
                      <p
                        style={{ color: "var(--text-muted)", fontSize: "12px" }}
                      >
                        {c.shopName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              Selecting a customer will link this sale to their account and
              update their total purchases.
            </p>

            <Btn
              onClick={() => {
                setConvertModal(null);
                setConvertSearch("");
                setConvertResults([]);
              }}
              color="var(--border)"
              style={{ width: "100%", color: "var(--text)" }}
            >
              Cancel
            </Btn>
          </Card>
        </div>
      )}
    </div>
  );
}
