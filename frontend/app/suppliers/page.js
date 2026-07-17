"use client";
import { useState, useEffect } from "react";
import { supplierAPI } from "../../lib/api";

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
      width: "100%",
      ...style,
    }}
    {...props}
  />
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

const labelStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  marginBottom: "6px",
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    city: "",
    gstNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await supplierAPI.getAll();
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    if (!query.trim()) {
      fetchSuppliers();
      return;
    }
    try {
      const res = await supplierAPI.search(query);
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!newSupplier.name) {
      alert("Supplier name is required");
      return;
    }
    try {
      await supplierAPI.create(newSupplier);
      setShowAddForm(false);
      setNewSupplier({
        name: "",
        phone: "",
        city: "",
        gstNumber: "",
        notes: "",
      });
      fetchSuppliers();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleEdit = async () => {
    try {
      await supplierAPI.update(editSupplier._id, editSupplier);
      setEditSupplier(null);
      fetchSuppliers();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Deactivate this supplier?")) return;
    try {
      await supplierAPI.delete(id);
      fetchSuppliers();
    } catch (err) {
      alert("Error deleting supplier");
    }
  };

  const formFields = [
    {
      label: "Supplier Name *",
      key: "name",
      placeholder: "e.g. Coca Cola Distributor",
    },
    { label: "Phone", key: "phone", placeholder: "e.g. 9876543210" },
    { label: "City", key: "city", placeholder: "e.g. Bhopal" },
    {
      label: "GST Number",
      key: "gstNumber",
      placeholder: "e.g. 23AAAAA0000A1Z5",
    },
    { label: "Notes", key: "notes", placeholder: "Any additional info..." },
  ];

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
          <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Suppliers</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            {suppliers.length} active suppliers
          </p>
        </div>
        <Btn onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Cancel" : "+ Add Supplier"}
        </Btn>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or city..."
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
            Add New Supplier
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {formFields.map((field) => (
              <div
                key={field.key}
                style={field.key === "notes" ? { gridColumn: "span 2" } : {}}
              >
                <label style={labelStyle}>{field.label}</label>
                <Input
                  placeholder={field.placeholder}
                  value={newSupplier[field.key]}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      [field.key]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <Btn onClick={handleAdd} color="var(--success)">
              Save Supplier
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

      {/* Suppliers Table */}
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
                    "Supplier",
                    "Phone",
                    "City",
                    "GST Number",
                    "Notes",
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
                {suppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier._id}
                      style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--surface-2)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ fontWeight: "500", fontSize: "13px" }}>
                          {supplier.name}
                        </p>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {supplier.phone || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {supplier.city || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {supplier.gstNumber || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "13px",
                        }}
                      >
                        {supplier.notes || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <Btn
                            onClick={() => setEditSupplier({ ...supplier })}
                            color="var(--warning)"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            Edit
                          </Btn>
                          <Btn
                            onClick={() => handleDelete(supplier._id)}
                            color="var(--danger)"
                            style={{ padding: "4px 10px", fontSize: "11px" }}
                          >
                            Delete
                          </Btn>
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
            {suppliers.length === 0 ? (
              <p
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No suppliers found
              </p>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier._id}
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontWeight: "600",
                          fontSize: "15px",
                          marginBottom: "4px",
                        }}
                      >
                        {supplier.name}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {supplier.phone && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            📞 {supplier.phone}
                          </p>
                        )}
                        {supplier.city && (
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            📍 {supplier.city}
                          </p>
                        )}
                        {supplier.gstNumber && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            GST: {supplier.gstNumber}
                          </p>
                        )}
                        {supplier.notes && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                            }}
                          >
                            {supplier.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <Btn
                      onClick={() => setEditSupplier({ ...supplier })}
                      color="var(--warning)"
                      style={{ padding: "8px", fontSize: "12px" }}
                    >
                      ✏️ Edit
                    </Btn>
                    <Btn
                      onClick={() => handleDelete(supplier._id)}
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

      {/* Edit Modal */}
      {editSupplier && (
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
          <Card style={{ width: "100%", maxWidth: "500px", margin: '0 12px' }}>
            <p
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              Edit Supplier
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              {formFields.map((field) => (
                <div
                  key={field.key}
                  style={field.key === "notes" ? { gridColumn: "span 2" } : {}}
                >
                  <label style={labelStyle}>{field.label}</label>
                  <Input
                    placeholder={field.placeholder}
                    value={editSupplier[field.key] || ""}
                    onChange={(e) =>
                      setEditSupplier({
                        ...editSupplier,
                        [field.key]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Btn onClick={handleEdit} color="var(--accent)">
                Save Changes
              </Btn>
              <Btn
                onClick={() => setEditSupplier(null)}
                color="var(--border)"
                style={{ color: "var(--text)" }}
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
