"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { customerAPI, saleAPI } from "../../../lib/api";

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

const StatCard = ({ label, value, color = "var(--text)" }) => (
  <div
    style={{
      background: "var(--surface-2)",
      border: "1px solid var(--border)",
      borderRadius: "10px",
      padding: "16px",
      textAlign: "center",
    }}
  >
    <p
      style={{
        color: "var(--text-muted)",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: "6px",
      }}
    >
      {label}
    </p>
    <p style={{ fontSize: "22px", fontWeight: "700", color }}>{value}</p>
  </div>
);

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modals state
  const [billModal, setBillModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [customersRes, salesRes] = await Promise.all([
        customerAPI.getAll(),
        saleAPI.getByCustomer(id),
      ]);
      setCustomer(customersRes.data.find((c) => c._id === id));
      setSales(salesRes.data);
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Error");
    }
    setPaymentLoading(false);
  };

  const filteredSales =
    statusFilter === "all"
      ? sales
      : sales.filter((s) => s.paymentStatus === statusFilter);
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.amountPaid, 0);
  const totalRemaining = sales.reduce((sum, s) => sum + s.remainingAmount, 0);

  if (loading)
    return (
      <p
        style={{
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "40px",
        }}
      >
        Loading...
      </p>
    );
  if (!customer)
    return (
      <p
        style={{
          color: "var(--text-muted)",
          textAlign: "center",
          padding: "40px",
        }}
      >
        Customer not found
      </p>
    );

  const statusColors = {
    paid: "var(--success)",
    unpaid: "var(--danger)",
    partial: "var(--warning)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Back */}
      <button
        onClick={() => router.push("/customers")}
        style={{
          background: "none",
          border: "none",
          color: "var(--accent)",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: 0,
        }}
      >
        ← Back to Customers
      </button>

      {/* Customer Info */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "var(--accent)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: "700",
                color: "white",
              }}
            >
              {customer.name[0]}
            </div>
            <div>
              <h1 style={{ fontSize: "20px", fontWeight: "700" }}>
                {customer.name}
              </h1>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {customer.shopName}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                {customer.phone}
              </p>
              {customer.address && (
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  {customer.address}
                </p>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Customer Since
            </p>
            <p style={{ fontWeight: "500", fontSize: "13px" }}>
              {new Date(customer.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          <StatCard
            label="Total Orders"
            value={sales.length}
            color="var(--accent)"
          />
          <StatCard
            label="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
          />
          <StatCard
            label="Amount Paid"
            value={`₹${totalPaid.toLocaleString()}`}
            color="var(--success)"
          />
          <StatCard
            label="Pending"
            value={`₹${totalRemaining.toLocaleString()}`}
            color="var(--danger)"
          />
          <StatCard
            label="Paid Bills"
            value={sales.filter((s) => s.paymentStatus === "paid").length}
            color="var(--success)"
          />
          <StatCard
            label="Unpaid/Partial"
            value={sales.filter((s) => s.paymentStatus !== "paid").length}
            color="var(--danger)"
          />
        </div>
      </Card>

      {/* Purchase History */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <p style={{ fontWeight: "600", fontSize: "14px" }}>
            Purchase History
          </p>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {["all", "paid", "partial", "unpaid"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  background:
                    statusFilter === s
                      ? statusColors[s] || "var(--accent)"
                      : "var(--border)",
                  color: "white",
                }}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="desktop-links">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  "Date",
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
                      textAlign:
                        h === "Total" || h === "Paid" || h === "Remaining"
                          ? "right"
                          : "left",
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
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
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
                filteredSales.map((sale) => (
                  <tr
                    key={sale._id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--surface-2)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "500" }}>
                        {new Date(sale.createdAt).toLocaleDateString("en-IN")}
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
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                      }}
                    >
                      {sale.items.length} item(s)
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontWeight: "600",
                        fontSize: "13px",
                        textAlign: "right",
                      }}
                    >
                      ₹{sale.totalAmount.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--success)",
                        fontWeight: "500",
                        fontSize: "13px",
                        textAlign: "right",
                      }}
                    >
                      ₹{sale.amountPaid.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "var(--danger)",
                        fontWeight: "500",
                        fontSize: "13px",
                        textAlign: "right",
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
                          onClick={() => setBillModal(sale)}
                          style={{
                            background: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          📄 View Bill
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
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                            }}
                          >
                            + Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
          {filteredSales.length === 0 ? (
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
            filteredSales.map((sale) => (
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
                    <p style={{ fontSize: "13px", fontWeight: "600" }}>
                      {new Date(sale.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(sale.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {sale.items.length} item(s)
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
                    <p style={{ fontSize: "13px", fontWeight: "600" }}>
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
                        fontWeight: "600",
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
                        fontWeight: "600",
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
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setBillModal(sale)}
                    style={{
                      flex: 1,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text)",
                      borderRadius: "8px",
                      padding: "8px",
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    📄 View Bill
                  </button>
                  {sale.paymentStatus !== "paid" && (
                    <button
                      onClick={() => {
                        setPaymentModal(sale);
                        setPaymentAmount("");
                        setPaymentNote("");
                      }}
                      style={{
                        flex: 1,
                        background: "var(--success)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      💰 Add Payment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Bill View Modal */}
      {billModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              id="bill-content"
              style={{
                background: "white",
                color: "#111",
                borderRadius: "12px",
                padding: "32px",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "16px",
                  marginBottom: "16px",
                }}
              >
                <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#111" }}>
                  PC StockPulse
                </h1>
                <p style={{ color: "#666", fontSize: "13px" }}>
                  FMCG Wholesale Distributor, Bhopal
                </p>
              </div>
              
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <p style={{ color: "#666", marginBottom: "4px" }}>Bill To</p>
                  <p style={{ fontWeight: "600", color: "#111" }}>
                    {customer.name}
                  </p>
                  <p style={{ color: "#444" }}>{customer.shopName}</p>
                  <p style={{ color: "#444" }}>{customer.phone}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "#666", marginBottom: "4px" }}>Date</p>
                  <p style={{ fontWeight: "500", color: "#111" }}>
                    {new Date(billModal.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p style={{ color: "#666", marginTop: "8px", marginBottom: "4px" }}>
                    Payment
                  </p>
                  <p
                    style={{
                      fontWeight: "600",
                      color:
                        billModal.paymentStatus === "paid"
                          ? "#16a34a"
                          : billModal.paymentStatus === "unpaid"
                            ? "#dc2626"
                            : "#d97706",
                      textTransform: "capitalize",
                    }}
                  >
                    {billModal.paymentStatus}
                  </p>
                  {billModal.paymentStatus === "partial" && (
                    <>
                      <p style={{ color: "#666", fontSize: "12px" }}>
                        Paid: ₹{billModal.amountPaid.toLocaleString()}
                      </p>
                      <p style={{ color: "#dc2626", fontSize: "12px" }}>
                        Due: ₹{billModal.remainingAmount.toLocaleString()}
                      </p>
                    </>
                  )}
                  {billModal.paymentStatus === "unpaid" && (
                    <p style={{ color: "#dc2626", fontSize: "12px" }}>
                      Due: ₹{billModal.totalAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                  marginBottom: "16px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    {[
                      "#",
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
                          padding: "8px 10px",
                          textAlign:
                            h === "#" ||
                            h === "Qty" ||
                            h === "Price" ||
                            h === "Discount" ||
                            h === "Total"
                              ? "right"
                              : "left",
                          color: "#444",
                          fontWeight: "600",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billModal.items.map((item, i) => (
                    <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "8px 10px", color: "#666", textAlign: "right" }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <p style={{ fontWeight: "500", color: "#111" }}>
                          {item.productName}
                        </p>
                        <p style={{ color: "#666", fontSize: "11px" }}>{item.brand}</p>
                      </td>
                      <td style={{ padding: "8px 10px", color: "#666" }}>
                        {item.variantName}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        ₹{item.unitPrice}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "#dc2626" }}>
                        {item.discountAmount > 0
                          ? `- ₹${item.discountAmount.toFixed(2)}`
                          : "—"}
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "600" }}>
                        ₹{item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                  fontSize: "13px",
                  borderTop: "1px solid #eee",
                  paddingTop: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", width: "200px" }}>
                  <span style={{ color: "#666" }}>Subtotal</span>
                  <span>
                    ₹{billModal.items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0).toLocaleString()}
                  </span>
                </div>
                {billModal.items.some(i => i.discountAmount > 0) && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "200px",
                      color: "#dc2626",
                    }}
                  >
                    <span>Discount</span>
                    <span>
                      - ₹{billModal.items.reduce((s, i) => s + (i.discountAmount || 0), 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "200px",
                    fontWeight: "700",
                    fontSize: "16px",
                    borderTop: "1px solid #eee",
                    paddingTop: "8px",
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: "#16a34a" }}>
                    ₹{billModal.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {billModal.notes && (
                <p
                  style={{
                    color: "#666",
                    fontSize: "12px",
                    marginTop: "16px",
                    borderTop: "1px solid #eee",
                    paddingTop: "12px",
                  }}
                >
                  Notes: {billModal.notes}
                </p>
              )}
              
              {billModal.paymentHistory?.length > 0 && (
                <div style={{ marginTop: "16px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
                  <p style={{ fontWeight: "600", fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "6px" }}>
                    Payment History
                  </p>
                  {billModal.paymentHistory.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#444", padding: "2px 0" }}>
                      <span>{new Date(p.date).toLocaleDateString("en-IN")} · {p.note}</span>
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>₹{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  textAlign: "center",
                  marginTop: "20px",
                  color: "#aaa",
                  fontSize: "11px",
                  borderTop: "1px solid #eee",
                  paddingTop: "12px",
                }}
              >
                Thank you for your business! · Generated by PC StockPulse
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setBillModal(null)}
                style={{
                  flex: 1,
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🖨 Print / Save PDF
              </button>
            </div>
          </div>
        </div>
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
          <Card style={{ width: "100%", maxWidth: "420px", margin: "0 12px" }}>
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
              Bill from{" "}
              {new Date(paymentModal.createdAt).toLocaleDateString("en-IN")}
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
                  label: "Total Bill",
                  value: `₹${paymentModal.totalAmount.toLocaleString()}`,
                  color: "var(--text)",
                },
                {
                  label: "Already Paid",
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
                  letterSpacing: "0.05em",
                }}
              >
                Amount (₹)
              </label>
              <Input
                type="number"
                placeholder={`Max ₹${paymentModal.remainingAmount}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                max={paymentModal.remainingAmount}
                min="1"
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
                  letterSpacing: "0.05em",
                }}
              >
                Note (optional)
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
                {paymentLoading ? "Saving..." : "Confirm Payment"}
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
    </div>
  );
}