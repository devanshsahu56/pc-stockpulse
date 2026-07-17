"use client";
import { useState, useEffect } from "react";
import { reportsAPI } from "../../lib/api";

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
      ...style,
    }}
    {...props}
  />
);

const Btn = ({ children, onClick, color = "var(--accent)", style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: color,
      color: "white",
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "500",
      border: "none",
      cursor: "pointer",
      ...style,
    }}
  >
    {children}
  </button>
);

const StatCard = ({ label, value, sub, color = "var(--text)" }) => (
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
    <p
      style={{
        fontSize: "24px",
        fontWeight: "700",
        color,
        marginBottom: "4px",
      }}
    >
      {value}
    </p>
    {sub && (
      <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>{sub}</p>
    )}
  </Card>
);

const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: "600",
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle = {
  padding: "12px 16px",
  fontSize: "13px",
  borderTop: "1px solid var(--border)",
};

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (dateFilter !== "custom") fetchReport();
  }, [dateFilter]);

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
    if (dateFilter === "all") return {};
    if (dateFilter === "custom" && startDate && endDate)
      return { startDate, endDate };
    return {};
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getSummary(getDateRange());
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const dateOptions = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
    { value: "custom", label: "Custom" },
  ];

  const tabs = [
    { value: "overview", label: "Monthly Breakdown" },
    { value: "products", label: "Product Wise" },
    { value: "brands", label: "Brand Wise" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Reports</h1>

      {/* Date Filter */}
      <Card>
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "10px",
          }}
        >
          Select Period
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateFilter(opt.value)}
              style={{
                padding: "6px 14px",
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
            <Btn onClick={fetchReport}>Apply</Btn>
          </div>
        )}
      </Card>

      {loading ? (
        <p
          style={{
            textAlign: "center",
            color: "var(--text-muted)",
            padding: "40px",
          }}
        >
          Loading report...
        </p>
      ) : !data ? null : (
        <>
          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
            }}
          >
            <StatCard
              label="Total Revenue"
              value={`₹${data.summary.totalRevenue.toLocaleString()}`}
              sub={`${data.summary.totalBills} bills`}
            />
            <StatCard
              label="Total Cost"
              value={`₹${data.summary.totalCost.toLocaleString()}`}
              color="var(--danger)"
            />
            <StatCard
              label="Gross Profit"
              value={`₹${data.summary.totalProfit.toLocaleString()}`}
              sub={`${data.summary.profitMargin}% margin`}
              color="var(--success)"
            />
            <StatCard
              label="Discount Given"
              value={`₹${data.summary.totalDiscount.toLocaleString()}`}
              color="var(--warning)"
            />
            <StatCard
              label="Collected"
              value={`₹${data.summary.totalCollected.toLocaleString()}`}
              color="var(--success)"
            />
            <StatCard
              label="Pending"
              value={`₹${data.summary.totalPending.toLocaleString()}`}
              color="var(--danger)"
            />
            <StatCard
              label="Total Bills"
              value={data.summary.totalBills}
              color="var(--accent)"
            />
            <StatCard
              label="Profit Margin"
              value={`${data.summary.profitMargin}%`}
              color="var(--accent)"
            />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  background:
                    activeTab === tab.value ? "var(--accent)" : "var(--border)",
                  color: "white",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Monthly Breakdown */}
          {activeTab === "overview" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Desktop Table */}
              <div className="desktop-links">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[
                        "Month",
                        "Bills",
                        "Revenue",
                        "Cost",
                        "Profit",
                        "Margin",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthly.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No data
                        </td>
                      </tr>
                    ) : (
                      data.monthly.map((m, i) => (
                        <tr
                          key={i}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td style={{ ...tdStyle, fontWeight: "500" }}>
                            {m.month}
                          </td>
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {m.bills}
                          </td>
                          <td style={tdStyle}>₹{m.revenue.toLocaleString()}</td>
                          <td style={{ ...tdStyle, color: "var(--danger)" }}>
                            ₹{m.cost.toLocaleString()}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            ₹{m.profit.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--accent)" }}>
                            {m.revenue > 0
                              ? ((m.profit / m.revenue) * 100).toFixed(1)
                              : 0}
                            %
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
                {data.monthly.length === 0 ? (
                  <p
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No data
                  </p>
                ) : (
                  data.monthly.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <p style={{ fontWeight: "600", fontSize: "15px" }}>
                          {m.month}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {m.bills} bills
                          </span>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "var(--accent)",
                              fontWeight: "600",
                            }}
                          >
                            {m.revenue > 0
                              ? ((m.profit / m.revenue) * 100).toFixed(1)
                              : 0}
                            % margin
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
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
                            Revenue
                          </p>
                          <p style={{ fontSize: "13px", fontWeight: "600" }}>
                            ₹{m.revenue.toLocaleString()}
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
                            Cost
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--danger)",
                            }}
                          >
                            ₹{m.cost.toLocaleString()}
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
                            Profit
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--success)",
                            }}
                          >
                            ₹{m.profit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Product Wise */}
          {activeTab === "products" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Desktop Table */}
              <div className="desktop-links">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[
                        "#",
                        "Product",
                        "Brand",
                        "Qty Sold",
                        "Revenue",
                        "Cost",
                        "Profit",
                        "Margin",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.length === 0 ? (
                      <tr>
                        <td
                          colSpan="8"
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No data
                        </td>
                      </tr>
                    ) : (
                      data.products.map((p, i) => (
                        <tr
                          key={i}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: "500" }}>
                            {p.productName}
                          </td>
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {p.brand}
                          </td>
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {p.totalQty}
                          </td>
                          <td style={tdStyle}>
                            ₹{p.totalRevenue.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--danger)" }}>
                            ₹{p.totalCost.toLocaleString()}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            ₹{p.totalProfit.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--accent)" }}>
                            {p.totalRevenue > 0
                              ? (
                                  (p.totalProfit / p.totalRevenue) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
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
                {data.products.length === 0 ? (
                  <p
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No data
                  </p>
                ) : (
                  data.products.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              background: "var(--accent)",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "white",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p style={{ fontWeight: "600", fontSize: "14px" }}>
                              {p.productName}
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {p.brand} · {p.totalQty} units sold
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "var(--accent)",
                            fontWeight: "600",
                          }}
                        >
                          {p.totalRevenue > 0
                            ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(
                                1,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
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
                            Revenue
                          </p>
                          <p style={{ fontSize: "13px", fontWeight: "600" }}>
                            ₹{p.totalRevenue.toLocaleString()}
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
                            Cost
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--danger)",
                            }}
                          >
                            ₹{p.totalCost.toLocaleString()}
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
                            Profit
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--success)",
                            }}
                          >
                            ₹{p.totalProfit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Brand Wise */}
          {activeTab === "brands" && (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Desktop Table */}
              <div className="desktop-links">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {[
                        "#",
                        "Brand",
                        "Qty Sold",
                        "Revenue",
                        "Cost",
                        "Profit",
                        "Margin",
                      ].map((h) => (
                        <th key={h} style={thStyle}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.brands.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                          }}
                        >
                          No data
                        </td>
                      </tr>
                    ) : (
                      data.brands.map((b, i) => (
                        <tr
                          key={i}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--surface-2)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {i + 1}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: "500" }}>
                            {b.brand}
                          </td>
                          <td
                            style={{ ...tdStyle, color: "var(--text-muted)" }}
                          >
                            {b.totalQty}
                          </td>
                          <td style={tdStyle}>
                            ₹{b.totalRevenue.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--danger)" }}>
                            ₹{b.totalCost.toLocaleString()}
                          </td>
                          <td
                            style={{
                              ...tdStyle,
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            ₹{b.totalProfit.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, color: "var(--accent)" }}>
                            {b.totalRevenue > 0
                              ? (
                                  (b.totalProfit / b.totalRevenue) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
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
                {data.brands.length === 0 ? (
                  <p
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                    }}
                  >
                    No data
                  </p>
                ) : (
                  data.brands.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              width: "24px",
                              height: "24px",
                              background: "var(--accent)",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "700",
                              color: "white",
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p style={{ fontWeight: "600", fontSize: "14px" }}>
                              {b.brand}
                            </p>
                            <p
                              style={{
                                fontSize: "12px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {b.totalQty} units sold
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "13px",
                            color: "var(--accent)",
                            fontWeight: "600",
                          }}
                        >
                          {b.totalRevenue > 0
                            ? ((b.totalProfit / b.totalRevenue) * 100).toFixed(
                                1,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "8px",
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
                            Revenue
                          </p>
                          <p style={{ fontSize: "13px", fontWeight: "600" }}>
                            ₹{b.totalRevenue.toLocaleString()}
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
                            Cost
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--danger)",
                            }}
                          >
                            ₹{b.totalCost.toLocaleString()}
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
                            Profit
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: "var(--success)",
                            }}
                          >
                            ₹{b.totalProfit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
