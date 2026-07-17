"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { customerAPI } from "../../lib/api";

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

const Badge = ({ label, color }) => (
  <span
    style={{
      fontSize: "11px",
      padding: "2px 8px",
      borderRadius: "4px",
      background: `${color}18`,
      color,
      border: `1px solid ${color}30`,
      fontWeight: "500",
    }}
  >
    {label}
  </span>
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

const labelStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  marginBottom: "4px",
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    shopName: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    if (query.trim() === "") {
      fetchCustomers();
      return;
    }
    try {
      const res = await customerAPI.search(query);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.shopName || !newCustomer.phone) {
      alert("Please fill name, shop name and phone");
      return;
    }
    try {
      await customerAPI.create(newCustomer);
      setShowAddForm(false);
      setNewCustomer({ name: "", shopName: "", phone: "", address: "" });
      fetchCustomers();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await customerAPI.delete(id);
      fetchCustomers();
    } catch (err) {
      alert("Error deleting customer");
    }
  };

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
          <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Customers</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            {customers.length} retailers
          </p>
        </div>
        <Btn onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Cancel" : "+ Add Customer"}
        </Btn>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or shop name..."
        value={search}
        onChange={handleSearch}
      />

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <p
            style={{
              fontWeight: "600",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            Add New Customer
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {[
              {
                label: "Customer Name *",
                key: "name",
                placeholder: "e.g. Ramesh Sharma",
              },
              {
                label: "Shop Name *",
                key: "shopName",
                placeholder: "e.g. Sharma General Store",
              },
              {
                label: "Phone *",
                key: "phone",
                placeholder: "e.g. 9876543210",
              },
              {
                label: "Address",
                key: "address",
                placeholder: "e.g. Main Market, Bhopal",
              },
            ].map((field) => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                <Input
                  placeholder={field.placeholder}
                  value={newCustomer[field.key]}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      [field.key]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <Btn onClick={handleAddCustomer} color="var(--success)">
              Save Customer
            </Btn>
            <Btn
              onClick={() => setShowAddForm(false)}
              color="var(--border)"
              style={{ color: "var(--text)" }}
            >
              Cancel
            </Btn>
          </div>
        </Card>
      )}

      {/* Customers Table */}
      {loading ? (
        <p
          style={{
            color: "var(--text-muted)",
            textAlign: "center",
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
                    "Customer",
                    "Shop",
                    "Phone",
                    "Address",
                    "Total Purchases",
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
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer._id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <Link
                          href={`/customers/${customer._id}`}
                          style={{ textDecoration: "none" }}
                        >
                          <p
                            style={{
                              fontWeight: "500",
                              fontSize: "13px",
                              color: "var(--accent)",
                            }}
                          >
                            {customer.name}
                          </p>
                        </Link>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {customer.shopName}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {customer.phone}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {customer.address || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <p
                          style={{
                            fontWeight: "600",
                            fontSize: "13px",
                            color: "var(--success)",
                          }}
                        >
                          ₹{customer.totalPurchases.toLocaleString()}
                        </p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Btn
                          onClick={() => handleDelete(customer._id)}
                          color="var(--danger)"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                        >
                          Delete
                        </Btn>
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
            {customers.length === 0 ? (
              <p
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No customers found
              </p>
            ) : (
              customers.map((customer) => (
                <div
                  key={customer._id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {/* Customer Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <Link
                        href={`/customers/${customer._id}`}
                        style={{ textDecoration: "none" }}
                      >
                        <p
                          style={{
                            fontWeight: "600",
                            fontSize: "15px",
                            color: "var(--accent)",
                            marginBottom: "2px",
                          }}
                        >
                          {customer.name}
                        </p>
                      </Link>
                      <p
                        style={{ color: "var(--text-muted)", fontSize: "13px" }}
                      >
                        {customer.shopName}
                      </p>
                    </div>
                    <p
                      style={{
                        fontWeight: "700",
                        fontSize: "15px",
                        color: "var(--success)",
                      }}
                    >
                      ₹{customer.totalPurchases.toLocaleString()}
                    </p>
                  </div>

                  {/* Contact Info */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                      📞 {customer.phone}
                    </p>
                    {customer.address && (
                      <p
                        style={{ fontSize: "13px", color: "var(--text-muted)" }}
                      >
                        📍 {customer.address}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <Link
                      href={`/customers/${customer._id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Btn
                        color="var(--accent)"
                        style={{
                          width: "100%",
                          padding: "8px",
                          fontSize: "12px",
                        }}
                      >
                        👁 View History
                      </Btn>
                    </Link>
                    <Btn
                      onClick={() => handleDelete(customer._id)}
                      color="var(--danger)"
                      style={{ padding: "8px", fontSize: "12px" }}
                    >
                      🗑 Delete
                    </Btn>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
