"use client";
import React, { useState, useEffect } from "react";
import { productAPI } from "../../lib/api";
import { supplierAPI } from "../../lib/api";

// Reusable components
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
      color: color,
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
      ...style,
    }}
    {...props}
  />
);

const Select = ({ children, style = {}, ...props }) => (
  <select
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
  >
    {children}
  </select>
);

const categories = [
  "Beverages",
  "Snacks",
  "Biscuits",
  "Dairy",
  "Confectionery",
  "Noodles & Pasta",
  "Chips & Namkeen",
  "Chocolates",
  "Personal Care",
  "Household",
  "Other",
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [newVariant, setNewVariant] = useState({
    name: "",
    quantity: "",
    price: "",
  });
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "",
    mrp: "",
    costPrice: "",
    sellingPrice: "",
    soldLoose: true,
    unitsPerCase: "",
    initialStockCases: "",
    initialStockLoose: "",
    reorderThreshold: 10,
    casePrice: "",
  });
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

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);
    if (query.trim() === "") {
      fetchProducts();
      return;
    }
    try {
      const res = await productAPI.search(query);
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getStockDisplay = (product) => {
    const stock = product.stock;
    const upc = product.unitsPerCase || 1;
    if (!product.soldLoose) {
      const cases = Math.floor(stock / upc);
      return {
        main: `${cases} cases`,
        sub: `${stock} units`,
        isLow: cases <= Math.floor(product.reorderThreshold / upc),
      };
    }
    const cases = Math.floor(stock / upc);
    const loose = stock % upc;
    return {
      main: `${cases}c + ${loose}u`,
      sub: `${stock} units total`,
      isLow: stock <= product.reorderThreshold,
    };
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.name ||
      !newProduct.brand ||
      !newProduct.mrp ||
      !newProduct.sellingPrice
    ) {
      alert("Please fill in all required fields");
      return;
    }
    let initialStock = 0;
    const upc = Number(newProduct.unitsPerCase) || 1;
    if (newProduct.soldLoose) {
      initialStock =
        (Number(newProduct.initialStockCases) || 0) * upc +
        (Number(newProduct.initialStockLoose) || 0);
    } else {
      initialStock = (Number(newProduct.initialStockCases) || 0) * upc;
    }
    const productData = {
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      mrp: Number(newProduct.mrp),
      costPrice: Number(newProduct.costPrice) || 0,
      sellingPrice: Number(newProduct.sellingPrice),
      soldLoose: newProduct.soldLoose,
      unitsPerCase: upc,
      stock: initialStock,
      reorderThreshold: Number(newProduct.reorderThreshold),
      variants: [],
    };
    if (newProduct.unitsPerCase && newProduct.casePrice) {
      productData.variants.push({
        name: "Full Case",
        quantity: upc,
        price: Number(newProduct.casePrice),
      });
    }
    try {
      await productAPI.create(productData);
      setShowAddForm(false);
      setNewProduct({
        name: "",
        brand: "",
        category: "",
        mrp: "",
        costPrice: "",
        sellingPrice: "",
        soldLoose: true,
        unitsPerCase: "",
        initialStockCases: "",
        initialStockLoose: "",
        reorderThreshold: 10,
        casePrice: "",
      });
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
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
        costPrice: "",
        supplierId: "",
        invoiceNumber: "",
        invoiceDate: "",
      });
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await productAPI.delete(id);
      fetchProducts();
    } catch (err) {
      alert("Error deleting product");
    }
  };

  const handleEditProduct = async () => {
    try {
      await productAPI.update(editProduct._id, {
        name: editProduct.name,
        brand: editProduct.brand,
        category: editProduct.category,
        mrp: Number(editProduct.mrp),
        costPrice: Number(editProduct.costPrice) || 0,
        sellingPrice: Number(editProduct.sellingPrice),
        soldLoose: editProduct.soldLoose,
        unitsPerCase: Number(editProduct.unitsPerCase) || 1,
        reorderThreshold: Number(editProduct.reorderThreshold),
      });
      setEditProduct(null);
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleAddVariant = async (productId) => {
    if (!newVariant.name || !newVariant.quantity || !newVariant.price) {
      alert("Fill all variant fields");
      return;
    }
    try {
      await productAPI.addVariant(productId, {
        name: newVariant.name,
        quantity: Number(newVariant.quantity),
        price: Number(newVariant.price),
      });
      setNewVariant({ name: "", quantity: "", price: "" });
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };

  const handleDeleteVariant = async (productId, variantId) => {
    if (!confirm("Delete variant?")) return;
    try {
      await productAPI.deleteVariant(productId, variantId);
      fetchProducts();
    } catch (err) {
      alert("Error deleting variant");
    }
  };

  const labelStyle = {
    fontSize: "11px",
    color: "var(--text-muted)",
    marginBottom: "4px",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const formGrid = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
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
          <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Inventory</h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "2px",
            }}
          >
            {products.length} products
          </p>
        </div>
        <Btn onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Cancel" : "+ Add Product"}
        </Btn>
      </div>

      {/* Search */}
      <Input
        placeholder="Search products by name or brand..."
        value={search}
        onChange={handleSearch}
        style={{ width: "100%" }}
      />

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <p
            style={{
              fontWeight: "600",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            Add New Product
          </p>
          <div style={formGrid}>
            <div>
              <label style={labelStyle}>Product Name *</label>
              <Input
                placeholder="e.g. Coca Cola 1.5L"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Brand *</label>
              <Input
                placeholder="e.g. Coca-Cola"
                value={newProduct.brand}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, brand: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <Select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label style={labelStyle}>MRP per unit (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 60"
                value={newProduct.mrp}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, mrp: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Cost Price per unit (₹)</label>
              <Input
                type="number"
                placeholder="e.g. 38"
                value={newProduct.costPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, costPrice: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Selling Price per unit (₹) *</label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={newProduct.sellingPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sellingPrice: e.target.value })
                }
              />
            </div>
            <div>
              <label style={labelStyle}>Reorder Threshold</label>
              <Input
                type="number"
                value={newProduct.reorderThreshold}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    reorderThreshold: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {/* Selling Type */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <label style={labelStyle}>Selling Type</label>
            <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
              {[
                { val: true, label: "Loose & Full Case" },
                { val: false, label: "Full Case Only" },
              ].map((opt) => (
                <label
                  key={String(opt.val)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    checked={newProduct.soldLoose === opt.val}
                    onChange={() =>
                      setNewProduct({ ...newProduct, soldLoose: opt.val })
                    }
                  />
                  <span style={{ fontSize: "13px" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Case Details */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <label style={labelStyle}>Case Details</label>
            <div style={{ ...formGrid, marginTop: "8px" }}>
              <div>
                <label style={labelStyle}>Units per Case</label>
                <Input
                  type="number"
                  placeholder="e.g. 24"
                  value={newProduct.unitsPerCase}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      unitsPerCase: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Full Case Selling Price (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g. 950"
                  value={newProduct.casePrice}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, casePrice: e.target.value })
                  }
                />
              </div>
              {newProduct.unitsPerCase && newProduct.mrp && (
                <p
                  style={{
                    gridColumn: "span 2",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  Full case MRP = ₹
                  {Number(newProduct.mrp) * Number(newProduct.unitsPerCase)}
                </p>
              )}
            </div>
          </div>

          {/* Initial Stock */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <label style={labelStyle}>Initial Stock</label>
            <div style={{ ...formGrid, marginTop: "8px" }}>
              <div>
                <label style={labelStyle}>Number of Cases</label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={newProduct.initialStockCases}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      initialStockCases: e.target.value,
                    })
                  }
                />
              </div>
              {newProduct.soldLoose && (
                <div>
                  <label style={labelStyle}>Extra Loose Units</label>
                  <Input
                    type="number"
                    placeholder="e.g. 6"
                    value={newProduct.initialStockLoose}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        initialStockLoose: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              {newProduct.initialStockCases && newProduct.unitsPerCase && (
                <p
                  style={{
                    gridColumn: "span 2",
                    fontSize: "12px",
                    color: "var(--success)",
                  }}
                >
                  Total ={" "}
                  {Number(newProduct.initialStockCases) *
                    Number(newProduct.unitsPerCase) +
                    (newProduct.soldLoose
                      ? Number(newProduct.initialStockLoose) || 0
                      : 0)}{" "}
                  units
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <Btn onClick={handleAddProduct} color="var(--success)">
              Save Product
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

      {/* Products Table */}
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
                    "Product",
                    "Brand",
                    "Category",
                    "MRP",
                    "Cost",
                    "Selling",
                    "Stock",
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
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const stockDisplay = getStockDisplay(product);
                    return (
                      <React.Fragment key={product._id}>
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
                            <p style={{ fontWeight: "500", fontSize: "13px" }}>
                              {product.name}
                            </p>
                            <Badge
                              label={
                                product.soldLoose ? "Loose+Case" : "Case Only"
                              }
                              color={
                                product.soldLoose
                                  ? "var(--accent)"
                                  : "var(--warning)"
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-muted)",
                              fontSize: "13px",
                            }}
                          >
                            {product.brand}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-muted)",
                              fontSize: "13px",
                            }}
                          >
                            {product.category || "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--text-muted)",
                              textDecoration: "line-through",
                            }}
                          >
                            ₹{product.mrp}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--danger)",
                            }}
                          >
                            ₹{product.costPrice || "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            ₹{product.sellingPrice}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: stockDisplay.isLow
                                  ? "var(--danger)"
                                  : "var(--success)",
                              }}
                            >
                              {stockDisplay.main}
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {stockDisplay.sub}
                            </p>
                            {stockDisplay.isLow && (
                              <Badge label="Low Stock" color="var(--danger)" />
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              <Btn
                                onClick={() => {
                                  setRestockModal(product);
                                  setRestockForm({
                                    quantity: "",
                                    unit: "cases",
                                    costPrice: product.costPrice || "",
                                    supplierId: product.primarySupplier || "",
                                    invoiceNumber: "",
                                    invoiceDate: new Date()
                                      .toISOString()
                                      .split("T")[0],
                                  });
                                }}
                                color="var(--accent)"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                }}
                              >
                                Restock
                              </Btn>
                              <Btn
                                onClick={() =>
                                  setEditProduct({
                                    ...product,
                                    category: product.category || "",
                                    mrp: product.mrp || "",
                                    costPrice: product.costPrice || "",
                                    sellingPrice: product.sellingPrice || "",
                                    unitsPerCase: product.unitsPerCase || "",
                                    reorderThreshold:
                                      product.reorderThreshold || 10,
                                  })
                                }
                                color="var(--warning)"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                }}
                              >
                                Edit
                              </Btn>
                              <Btn
                                onClick={() =>
                                  setExpandedProduct(
                                    expandedProduct === product._id
                                      ? null
                                      : product._id,
                                  )
                                }
                                color="var(--border)"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                  color: "var(--text)",
                                }}
                              >
                                {expandedProduct === product._id
                                  ? "Hide"
                                  : "Variants"}
                              </Btn>
                              <Btn
                                onClick={() => handleDelete(product._id)}
                                color="var(--danger)"
                                style={{
                                  padding: "4px 10px",
                                  fontSize: "11px",
                                }}
                              >
                                Delete
                              </Btn>
                            </div>
                          </td>
                        </tr>
                        {expandedProduct === product._id && (
                          <tr
                            style={{
                              background: "var(--surface-2)",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <td colSpan="8" style={{ padding: "16px 24px" }}>
                              <p
                                style={{
                                  fontWeight: "600",
                                  fontSize: "13px",
                                  color: "var(--accent)",
                                  marginBottom: "12px",
                                }}
                              >
                                Variants — {product.name}
                              </p>
                              {product.variants.length === 0 ? (
                                <p
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: "13px",
                                    marginBottom: "12px",
                                  }}
                                >
                                  No variants yet
                                </p>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                    marginBottom: "12px",
                                  }}
                                >
                                  {product.variants.map((variant) => (
                                    <div
                                      key={variant._id}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "16px",
                                        padding: "8px 12px",
                                        background: "var(--surface)",
                                        borderRadius: "8px",
                                        border: "1px solid var(--border)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: "500",
                                          fontSize: "13px",
                                          flex: 1,
                                        }}
                                      >
                                        {variant.name}
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--text-muted)",
                                          fontSize: "13px",
                                        }}
                                      >
                                        {variant.quantity} units
                                      </span>
                                      <span
                                        style={{
                                          color: "var(--success)",
                                          fontWeight: "600",
                                          fontSize: "13px",
                                        }}
                                      >
                                        ₹{variant.price}
                                      </span>
                                      <Btn
                                        onClick={() =>
                                          handleDeleteVariant(
                                            product._id,
                                            variant._id,
                                          )
                                        }
                                        color="var(--danger)"
                                        style={{
                                          padding: "3px 8px",
                                          fontSize: "11px",
                                        }}
                                      >
                                        Delete
                                      </Btn>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  alignItems: "flex-end",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <label style={labelStyle}>Variant Name</label>
                                  <Input
                                    placeholder="e.g. Full Case"
                                    value={newVariant.name}
                                    onChange={(e) =>
                                      setNewVariant({
                                        ...newVariant,
                                        name: e.target.value,
                                      })
                                    }
                                    style={{ width: "140px" }}
                                  />
                                </div>
                                <div>
                                  <label style={labelStyle}>
                                    Units per Pack
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 24"
                                    value={newVariant.quantity}
                                    onChange={(e) =>
                                      setNewVariant({
                                        ...newVariant,
                                        quantity: e.target.value,
                                      })
                                    }
                                    style={{ width: "110px" }}
                                  />
                                </div>
                                <div>
                                  <label style={labelStyle}>Price (₹)</label>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 950"
                                    value={newVariant.price}
                                    onChange={(e) =>
                                      setNewVariant({
                                        ...newVariant,
                                        price: e.target.value,
                                      })
                                    }
                                    style={{ width: "110px" }}
                                  />
                                </div>
                                <Btn
                                  onClick={() => handleAddVariant(product._id)}
                                  color="var(--accent)"
                                >
                                  + Add
                                </Btn>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div
            className="mobile-only"
            style={{ display: "flex", flexDirection: "column", gap: "1px" }}
          >
            {products.length === 0 ? (
              <p
                style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                No products found
              </p>
            ) : (
              products.map((product) => {
                const stockDisplay = getStockDisplay(product);
                return (
                  <div
                    key={product._id}
                    style={{
                      padding: "16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Product Header */}
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
                            fontSize: "14px",
                            marginBottom: "4px",
                          }}
                        >
                          {product.name}
                        </p>
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          {product.brand} · {product.category || "No category"}
                        </p>
                      </div>
                      <Badge
                        label={product.soldLoose ? "Loose+Case" : "Case Only"}
                        color={
                          product.soldLoose ? "var(--accent)" : "var(--warning)"
                        }
                      />
                    </div>

                    {/* Price Row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "8px",
                        marginBottom: "10px",
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
                          MRP
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            textDecoration: "line-through",
                            color: "var(--text-muted)",
                          }}
                        >
                          ₹{product.mrp}
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
                            color: "var(--danger)",
                            fontWeight: "600",
                          }}
                        >
                          ₹{product.costPrice || "—"}
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
                          Selling
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "var(--success)",
                            fontWeight: "600",
                          }}
                        >
                          ₹{product.sellingPrice}
                        </p>
                      </div>
                    </div>

                    {/* Stock */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          Stock
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: stockDisplay.isLow
                              ? "var(--danger)"
                              : "var(--success)",
                          }}
                        >
                          {stockDisplay.main}
                        </p>
                        <p
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {stockDisplay.sub}
                        </p>
                      </div>
                      {stockDisplay.isLow && (
                        <Badge label="Low Stock" color="var(--danger)" />
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "6px",
                      }}
                    >
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
                        color="var(--accent)"
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        📦 Restock
                      </Btn>
                      <Btn
                        onClick={() =>
                          setEditProduct({
                            ...product,
                            category: product.category || "",
                            mrp: product.mrp || "",
                            costPrice: product.costPrice || "",
                            sellingPrice: product.sellingPrice || "",
                            unitsPerCase: product.unitsPerCase || "",
                            reorderThreshold: product.reorderThreshold || 10,
                          })
                        }
                        color="var(--warning)"
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        ✏️ Edit
                      </Btn>
                      <Btn
                        onClick={() =>
                          setExpandedProduct(
                            expandedProduct === product._id
                              ? null
                              : product._id,
                          )
                        }
                        color="var(--border)"
                        style={{
                          padding: "8px",
                          fontSize: "12px",
                          color: "var(--text)",
                        }}
                      >
                        {expandedProduct === product._id
                          ? "Hide Variants"
                          : "🏷 Variants"}
                      </Btn>
                      <Btn
                        onClick={() => handleDelete(product._id)}
                        color="var(--danger)"
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        🗑 Delete
                      </Btn>
                    </div>

                    {/* Variants Expanded */}
                    {expandedProduct === product._id && (
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
                            fontSize: "13px",
                            color: "var(--accent)",
                            marginBottom: "8px",
                          }}
                        >
                          Variants
                        </p>
                        {product.variants.length === 0 ? (
                          <p
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            No variants yet
                          </p>
                        ) : (
                          product.variants.map((variant) => (
                            <div
                              key={variant._id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "8px",
                                background: "var(--surface)",
                                borderRadius: "6px",
                                marginBottom: "4px",
                              }}
                            >
                              <p
                                style={{ fontSize: "13px", fontWeight: "500" }}
                              >
                                {variant.name}
                              </p>
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {variant.quantity} units
                              </p>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "var(--success)",
                                  fontWeight: "600",
                                }}
                              >
                                ₹{variant.price}
                              </p>
                              <Btn
                                onClick={() =>
                                  handleDeleteVariant(product._id, variant._id)
                                }
                                color="var(--danger)"
                                style={{ padding: "3px 8px", fontSize: "11px" }}
                              >
                                ×
                              </Btn>
                            </div>
                          ))
                        )}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          <Input
                            placeholder="Variant Name (e.g. Full Case)"
                            value={newVariant.name}
                            onChange={(e) =>
                              setNewVariant({
                                ...newVariant,
                                name: e.target.value,
                              })
                            }
                          />
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "8px",
                            }}
                          >
                            <Input
                              type="number"
                              placeholder="Units per Pack"
                              value={newVariant.quantity}
                              onChange={(e) =>
                                setNewVariant({
                                  ...newVariant,
                                  quantity: e.target.value,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Price (₹)"
                              value={newVariant.price}
                              onChange={(e) =>
                                setNewVariant({
                                  ...newVariant,
                                  price: e.target.value,
                                })
                              }
                            />
                          </div>
                          <Btn
                            onClick={() => handleAddVariant(product._id)}
                            color="var(--accent)"
                            style={{ width: "100%", padding: "8px" }}
                          >
                            + Add Variant
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      {editProduct && (
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
          <Card
            style={{
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              margin: '0 12px'
            }}
          >
            <p
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "16px",
              }}
            >
              Edit Product
            </p>
            <div style={formGrid}>
              {[
                { label: "Product Name", key: "name", type: "text" },
                { label: "Brand", key: "brand", type: "text" },
                { label: "MRP (₹)", key: "mrp", type: "number" },
                { label: "Cost Price (₹)", key: "costPrice", type: "number" },
                {
                  label: "Selling Price (₹)",
                  key: "sellingPrice",
                  type: "number",
                },
                {
                  label: "Units per Case",
                  key: "unitsPerCase",
                  type: "number",
                },
                {
                  label: "Reorder Threshold",
                  key: "reorderThreshold",
                  type: "number",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <Input
                    type={field.type}
                    value={editProduct[field.key] || ""}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        [field.key]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Category</label>
                <Select
                  value={editProduct.category || ""}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, category: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
              }}
            >
              <label style={labelStyle}>Selling Type</label>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                {[
                  { val: true, label: "Loose & Full Case" },
                  { val: false, label: "Full Case Only" },
                ].map((opt) => (
                  <label
                    key={String(opt.val)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      checked={editProduct.soldLoose === opt.val}
                      onChange={() =>
                        setEditProduct({ ...editProduct, soldLoose: opt.val })
                      }
                    />
                    <span style={{ fontSize: "13px" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "12px",
              }}
            >
              * Stock can only be changed via Restock
            </p>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <Btn onClick={handleEditProduct} color="var(--accent)">
                Save Changes
              </Btn>
              <Btn
                onClick={() => setEditProduct(null)}
                color="var(--border)"
                style={{ color: "var(--text)" }}
              >
                Cancel
              </Btn>
            </div>
          </Card>
        </div>
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
          <Card
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Modal Header */}
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

            {/* Current Stock Info */}
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
                <p
                  style={{
                    fontWeight: "600",
                    color:
                      restockModal.stock <= restockModal.reorderThreshold
                        ? "var(--danger)"
                        : "var(--success)",
                  }}
                >
                  {restockModal.soldLoose
                    ? `${Math.floor(restockModal.stock / (restockModal.unitsPerCase || 1))} cases + ${restockModal.stock % (restockModal.unitsPerCase || 1)} loose`
                    : `${Math.floor(restockModal.stock / (restockModal.unitsPerCase || 1))} cases`}{" "}
                  ({restockModal.stock} units)
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
                  <label style={labelStyle}>Quantity *</label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={restockForm.quantity}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        quantity: e.target.value,
                      })
                    }
                    min="1"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Unit</label>
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

              {/* Units preview */}
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
                  units will be added to stock
                </p>
              )}

              {/* Purchase Price */}
              {/* Purchase Price */}
              <div>
                <label style={labelStyle}>
                  Purchase Price{" "}
                  {restockForm.unit === "cases"
                    ? "per Case (₹)"
                    : "per Unit (₹)"}{" "}
                  *
                </label>
                <Input
                  type="number"
                  placeholder={
                    restockForm.unit === "cases"
                      ? `e.g. ₹${(restockModal.costPrice * (restockModal.unitsPerCase || 1)).toFixed(2)} per case`
                      : `Last price: ₹${restockModal.costPrice || 0} per unit`
                  }
                  value={restockForm.costPrice}
                  onChange={(e) =>
                    setRestockForm({
                      ...restockForm,
                      costPrice: e.target.value,
                    })
                  }
                  min="0"
                />

                {/* Price breakdown preview */}
                {restockForm.costPrice && (
                  <div style={{ marginTop: "6px", fontSize: "12px" }}>
                    {restockForm.unit === "cases" ? (
                      <div style={{ display: "flex", gap: "16px" }}>
                        <span style={{ color: "var(--accent)" }}>
                          Per unit cost = ₹
                          {(
                            Number(restockForm.costPrice) /
                            (restockModal.unitsPerCase || 1)
                          ).toFixed(2)}
                        </span>
                        {Number(restockForm.costPrice) /
                          (restockModal.unitsPerCase || 1) !==
                        restockModal.costPrice ? (
                          <span style={{ color: "var(--warning)" }}>
                            ⚠ Cost changed: ₹{restockModal.costPrice} → ₹
                            {(
                              Number(restockForm.costPrice) /
                              (restockModal.unitsPerCase || 1)
                            ).toFixed(2)}{" "}
                            per unit
                          </span>
                        ) : (
                          <span style={{ color: "var(--success)" }}>
                            ✓ Same cost as last purchase
                          </span>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "16px" }}>
                        <span style={{ color: "var(--accent)" }}>
                          Per case cost = ₹
                          {(
                            Number(restockForm.costPrice) *
                            (restockModal.unitsPerCase || 1)
                          ).toFixed(2)}
                        </span>
                        {Number(restockForm.costPrice) !==
                        restockModal.costPrice ? (
                          <span style={{ color: "var(--warning)" }}>
                            ⚠ Cost changed: ₹{restockModal.costPrice} → ₹
                            {restockForm.costPrice} per unit
                          </span>
                        ) : (
                          <span style={{ color: "var(--success)" }}>
                            ✓ Same cost as last purchase
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Supplier Selection */}
              <div>
                <label style={labelStyle}>Supplier</label>
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
                      {s.name} {s.city ? `— ${s.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Details */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <label style={labelStyle}>Invoice Number (optional)</label>
                  <Input
                    placeholder="e.g. INV-2024-001"
                    value={restockForm.invoiceNumber}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        invoiceNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label style={labelStyle}>Invoice Date (optional)</label>
                  <Input
                    type="date"
                    value={restockForm.invoiceDate}
                    onChange={(e) =>
                      setRestockForm({
                        ...restockForm,
                        invoiceDate: e.target.value,
                      })
                    }
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
                        }}
                      >
                        Total Units
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "var(--text)",
                        }}
                      >
                        {restockForm.unit === "cases"
                          ? Number(restockForm.quantity) *
                            (restockModal.unitsPerCase || 1)
                          : Number(restockForm.quantity)}{" "}
                        units
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
                        }}
                      >
                        Per Unit Cost
                      </p>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "var(--text)",
                        }}
                      >
                        ₹
                        {restockForm.unit === "cases"
                          ? (
                              Number(restockForm.costPrice) /
                              (restockModal.unitsPerCase || 1)
                            ).toFixed(2)
                          : Number(restockForm.costPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
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
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
              <Btn
                onClick={handleRestock}
                color="var(--success)"
                style={{ flex: 1, padding: "10px", fontSize: "14px" }}
              >
                Confirm Restock
              </Btn>
              <Btn
                onClick={() => setRestockModal(null)}
                color="var(--border)"
                style={{
                  flex: 1,
                  padding: "10px",
                  fontSize: "14px",
                  color: "var(--text)",
                }}
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
