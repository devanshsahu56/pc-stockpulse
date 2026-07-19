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
  const [sortBy, setSortBy] = useState("name");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "",
    soldLoose: true,
    // Loose + Full Case fields
    unitsPerCase: "",
    mrp: "",
    mrpPerCase: "",
    sellingPricePerPiece: "",
    sellingPricePerCase: "",
    costPricePerCase: "",
    // Full Case Only fields
    buyingPricePerCase: "",
    sellingPrice: "",
    // Common
    initialStockCases: "",
    initialStockLoose: "",
    reorderThreshold: 10,
  });
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
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

  const loadBrands = async () => {
    try {
      const res = await productAPI.getAll();
      const brands = [...new Set(res.data.map((p) => p.brand).filter(Boolean))];
      localStorage.setItem("savedBrands", JSON.stringify(brands.sort()));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    loadBrands();
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
    if (!newProduct.name || !newProduct.brand) {
      alert("Please fill in product name and brand");
      return;
    }

    let productData = {
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      soldLoose: newProduct.soldLoose,
      reorderThreshold: Number(newProduct.reorderThreshold),
      ownerId: undefined,
      variants: [],
    };

    if (newProduct.soldLoose) {
      // Loose + Full Case validation
      if (
        !newProduct.costPricePerCase ||
        !newProduct.unitsPerCase ||
        !newProduct.mrp ||
        !newProduct.sellingPricePerCase ||
        !newProduct.sellingPricePerPiece
      ) {
        alert("Please fill in all required fields");
        return;
      }

      const upc = Number(newProduct.unitsPerCase);
      const mrpPerCase = Number(newProduct.mrp) * upc;
      const costPerPiece = Number(newProduct.costPricePerCase) / upc;

      productData = {
        ...productData,
        unitsPerCase: upc,
        mrp: Number(newProduct.mrp),
        mrpPerCase,
        sellingPricePerPiece: Number(newProduct.sellingPricePerPiece),
        sellingPricePerCase: Number(newProduct.sellingPricePerCase),
        costPricePerCase: Number(newProduct.costPricePerCase),
        costPrice: costPerPiece * upc,
        sellingPrice: Number(newProduct.sellingPricePerPiece),
        // Auto add Full Case variant
        variants: [
          {
            name: "Full Case",
            quantity: upc,
            price: Number(newProduct.sellingPricePerCase),
          },
        ],
      };

      // Calculate stock
      const cases = Number(newProduct.initialStockCases) || 0;
      const loose = Number(newProduct.initialStockLoose) || 0;
      productData.stock = cases * upc + loose;
    } else {
      // Full Case Only validation
      if (!newProduct.buyingPricePerCase || !newProduct.sellingPrice) {
        alert("Please fill in buying and selling price");
        return;
      }

      productData = {
        ...productData,
        unitsPerCase: 1,
        buyingPricePerCase: Number(newProduct.buyingPricePerCase),
        costPricePerCase: Number(newProduct.buyingPricePerCase),
        costPrice: Number(newProduct.buyingPricePerCase),
        sellingPrice: Number(newProduct.sellingPrice),
        sellingPricePerCase: Number(newProduct.sellingPrice),
      };

      const cases = Number(newProduct.initialStockCases) || 0;
      productData.stock = cases;
    }

    try {
      await productAPI.create(productData);
      setShowAddForm(false);
      setNewProduct({
        name: "",
        brand: "",
        category: "",
        soldLoose: true,
        unitsPerCase: "",
        mrp: "",
        mrpPerCase: "",
        sellingPricePerPiece: "",
        sellingPricePerCase: "",
        costPricePerCase: "",
        buyingPricePerCase: "",
        sellingPrice: "",
        initialStockCases: "",
        initialStockLoose: "",
        reorderThreshold: 10,
      });
      fetchProducts();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
  };
  // Save brand to localStorage
  const saveBrand = (brand) => {
    if (!brand.trim()) return;
    const existing = JSON.parse(localStorage.getItem("savedBrands") || "[]");
    if (!existing.includes(brand.trim())) {
      const updated = [...existing, brand.trim()].sort();
      localStorage.setItem("savedBrands", JSON.stringify(updated));
    }
  };

  // Get saved brands
  const getSavedBrands = () => {
    return JSON.parse(localStorage.getItem("savedBrands") || "[]");
  };

  // Filter brands based on input
  const filterBrands = (input) => {
    if (!input.trim()) return [];
    const saved = getSavedBrands();
    return saved.filter((b) => b.toLowerCase().startsWith(input.toLowerCase()));
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
      loadBrands();
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
      const upc = Number(editProduct.unitsPerCase) || 1;
      const mrpPerCase = Number(editProduct.mrp) * upc;
      const costPerPiece = editProduct.costPricePerCase
        ? Number(editProduct.costPricePerCase) / upc
        : 0;

      await productAPI.update(editProduct._id, {
        name: editProduct.name,
        brand: editProduct.brand,
        category: editProduct.category,
        mrp: Number(editProduct.mrp) || 0,
        mrpPerCase,
        costPricePerCase: Number(editProduct.costPricePerCase) || 0,
        costPrice: costPerPiece,
        sellingPricePerPiece: Number(editProduct.sellingPricePerPiece) || 0,
        sellingPricePerCase: Number(editProduct.sellingPricePerCase) || 0,
        sellingPrice: Number(editProduct.sellingPricePerPiece) || 0,
        soldLoose: editProduct.soldLoose,
        unitsPerCase: upc,
        reorderThreshold: Number(editProduct.reorderThreshold),
      });
      saveBrand(editProduct.brand);
      setEditProduct(null);
      fetchProducts();
      loadBrands();
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
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
  const sortedProducts = [...products]
    .filter((p) => !filterCategory || p.category === filterCategory)
    .filter((p) => !filterBrand || p.brand === filterBrand)
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "brand")
        return (a.brand || "").localeCompare(b.brand || "");
      if (sortBy === "mrp_asc") return (a.mrp || 0) - (b.mrp || 0);
      if (sortBy === "mrp_desc") return (b.mrp || 0) - (a.mrp || 0);
      if (sortBy === "stock_asc") return a.stock - b.stock;
      if (sortBy === "stock_desc") return b.stock - a.stock;
      return 0;
    });

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
            {sortedProducts.length} products
          </p>
        </div>
        <Btn onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "✕ Cancel" : "+ Add Product"}
        </Btn>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Search — takes most space */}
        <Input
          placeholder="Search products..."
          value={search}
          onChange={handleSearch}
          style={{ flex: 1, minWidth: "200px" }}
        />

        {/* Filters — compact, right aligned */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: filterCategory ? "var(--accent)" : "var(--text-muted)",
              borderRadius: "8px",
              padding: "6px 8px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: filterBrand ? "var(--accent)" : "var(--text-muted)",
              borderRadius: "8px",
              padding: "6px 8px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="">Brand</option>
            {[...new Set(products.map((p) => p.brand).filter(Boolean))]
              .sort()
              .map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: sortBy !== "name" ? "var(--accent)" : "var(--text-muted)",
              borderRadius: "8px",
              padding: "6px 8px",
              fontSize: "12px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="name">Sort</option>
            <option value="brand">Brand A→Z</option>
            <option value="mrp_asc">MRP ↑</option>
            <option value="mrp_desc">MRP ↓</option>
            <option value="stock_asc">Stock ↑</option>
            <option value="stock_desc">Stock ↓</option>
          </select>

          {/* Clear — only shows when filters active */}
          {(filterCategory || filterBrand || sortBy !== "name") && (
            <button
              onClick={() => {
                setFilterCategory("");
                setFilterBrand("");
                setSortBy("name");
              }}
              style={{
                background: "var(--danger)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "6px 8px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

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

          {/* Basic Info */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
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
              <label style={labelStyle}>Brand Name *</label>
              <div style={{ position: "relative" }}>
                <Input
                  placeholder="e.g. Coca-Cola"
                  value={newProduct.brand}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewProduct({ ...newProduct, brand: val });
                    const saved = JSON.parse(
                      localStorage.getItem("savedBrands") || "[]",
                    );
                    const filtered = saved.filter((b) =>
                      b.toLowerCase().startsWith(val.toLowerCase()),
                    );
                    setBrandSuggestions(filtered);
                    setShowBrandDropdown(
                      filtered.length > 0 && val.trim().length > 0,
                    );
                  }}
                  onFocus={() => {
                    if (newProduct.brand.trim()) {
                      const saved = JSON.parse(
                        localStorage.getItem("savedBrands") || "[]",
                      );
                      const filtered = saved.filter((b) =>
                        b
                          .toLowerCase()
                          .startsWith(newProduct.brand.toLowerCase()),
                      );
                      setBrandSuggestions(filtered);
                      setShowBrandDropdown(filtered.length > 0);
                    }
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowBrandDropdown(false), 150)
                  }
                  autoComplete="off"
                />
                {showBrandDropdown && brandSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 50,
                      width: "100%",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      marginTop: "4px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    {brandSuggestions.map((brand) => (
                      <div
                        key={brand}
                        onMouseDown={() => {
                          setNewProduct({ ...newProduct, brand });
                          setShowBrandDropdown(false);
                          setBrandSuggestions([]);
                        }}
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontSize: "13px",
                          borderBottom: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--surface-2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {brand}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

          {/* Product Type */}
          <div
            style={{
              marginBottom: "20px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <label style={labelStyle}>Product Type *</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginTop: "8px",
              }}
            >
              {[
                {
                  val: true,
                  label: "Loose + Full Case",
                  desc: "Sold both per piece and per case",
                  icon: "📦",
                },
                {
                  val: false,
                  label: "Full Case Only",
                  desc: "Sold only as full cases",
                  icon: "🏭",
                },
              ].map((opt) => (
                <div
                  key={String(opt.val)}
                  onClick={() =>
                    setNewProduct({ ...newProduct, soldLoose: opt.val })
                  }
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    border: `2px solid ${newProduct.soldLoose === opt.val ? "var(--accent)" : "var(--border)"}`,
                    background:
                      newProduct.soldLoose === opt.val
                        ? "rgba(99,102,241,0.08)"
                        : "var(--surface-2)",
                  }}
                >
                  <p style={{ fontSize: "20px", marginBottom: "4px" }}>
                    {opt.icon}
                  </p>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "13px",
                      color:
                        newProduct.soldLoose === opt.val
                          ? "var(--accent)"
                          : "var(--text)",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {opt.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Loose + Full Case Fields */}
          {newProduct.soldLoose && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {/* Case Info */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                    color: "var(--accent)",
                  }}
                >
                  📦 Case Information
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Cost Price (per Case) *</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 840"
                        value={newProduct.costPricePerCase}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            costPricePerCase: e.target.value,
                          })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/case
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Total Pieces in One Case *</label>
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
                </div>
                {newProduct.costPricePerCase && newProduct.unitsPerCase && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "8px",
                    }}
                  >
                    Cost per piece = ₹
                    {(
                      Number(newProduct.costPricePerCase) /
                      Number(newProduct.unitsPerCase)
                    ).toFixed(2)}
                  </p>
                )}
              </div>

              {/* MRP */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                    color: "var(--warning)",
                  }}
                >
                  🏷 MRP
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>MRP (per Piece) *</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 45"
                        value={newProduct.mrp}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, mrp: e.target.value })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/piece
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      MRP (per Case) — Auto Calculated
                    </label>
                    <div
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        color:
                          newProduct.mrp && newProduct.unitsPerCase
                            ? "var(--warning)"
                            : "var(--text-muted)",
                        fontWeight: "600",
                      }}
                    >
                      {newProduct.mrp && newProduct.unitsPerCase
                        ? `₹${(Number(newProduct.mrp) * Number(newProduct.unitsPerCase)).toLocaleString()} /case`
                        : "Enter MRP per piece + pieces per case"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Selling Price */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                    color: "var(--success)",
                  }}
                >
                  💰 Selling Price
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Selling Price (per Case) *</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 950"
                        value={newProduct.sellingPricePerCase}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            sellingPricePerCase: e.target.value,
                          })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/case
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Selling Price (per Piece) *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 42"
                        value={newProduct.sellingPricePerPiece}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            sellingPricePerPiece: e.target.value,
                          })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/piece
                      </span>
                    </div>
                  </div>
                </div>
                {newProduct.sellingPricePerCase &&
                  newProduct.costPricePerCase && (
                    <p
                      style={{
                        fontSize: "12px",
                        marginTop: "8px",
                        color:
                          Number(newProduct.sellingPricePerCase) >
                          Number(newProduct.costPricePerCase)
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      Margin per case = ₹
                      {(
                        Number(newProduct.sellingPricePerCase) -
                        Number(newProduct.costPricePerCase)
                      ).toFixed(2)}
                      {newProduct.unitsPerCase &&
                        ` | Per piece = ₹${((Number(newProduct.sellingPricePerCase) - Number(newProduct.costPricePerCase)) / Number(newProduct.unitsPerCase)).toFixed(2)}`}
                    </p>
                  )}
              </div>

              {/* Initial Stock */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  📊 Initial Stock
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
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
                  <div>
                    <label style={labelStyle}>Extra Loose Pieces</label>
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
                </div>
                {newProduct.initialStockCases && newProduct.unitsPerCase && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--success)",
                      marginTop: "8px",
                    }}
                  >
                    Total ={" "}
                    {Number(newProduct.initialStockCases) *
                      Number(newProduct.unitsPerCase) +
                      (Number(newProduct.initialStockLoose) || 0)}{" "}
                    pieces
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Full Case Only Fields */}
          {!newProduct.soldLoose && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                    color: "var(--accent)",
                  }}
                >
                  💼 Case Pricing
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Buying Price (per Case) *</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 500"
                        value={newProduct.buyingPricePerCase}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            buyingPricePerCase: e.target.value,
                          })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/case
                      </span>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Selling Price (per Case) *</label>
                    <div style={{ position: "relative" }}>
                      <Input
                        type="number"
                        placeholder="e.g. 580"
                        value={newProduct.sellingPrice}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            sellingPrice: e.target.value,
                          })
                        }
                      />
                      <span
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        ₹/case
                      </span>
                    </div>
                  </div>
                </div>
                {newProduct.buyingPricePerCase && newProduct.sellingPrice && (
                  <p
                    style={{
                      fontSize: "12px",
                      marginTop: "8px",
                      color:
                        Number(newProduct.sellingPrice) >
                        Number(newProduct.buyingPricePerCase)
                          ? "var(--success)"
                          : "var(--danger)",
                    }}
                  >
                    Margin per case = ₹
                    {(
                      Number(newProduct.sellingPrice) -
                      Number(newProduct.buyingPricePerCase)
                    ).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Initial Stock — Cases Only */}
              <div
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  📊 Initial Stock
                </p>
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
              </div>
            </div>
          )}

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
                  {/* In table headers */}
                  {[
                    "Product",
                    "Brand",
                    "Category",
                    "MRP/pc",
                    "Cost/case",
                    "Sell/pc",
                    "Sell/case",
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
                {sortedProducts.length === 0 ? (
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
                  sortedProducts.map((product) => {
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
                            {product.mrp ? `₹${product.mrp}` : "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--danger)",
                            }}
                          >
                            {product.costPricePerCase
                              ? `₹${product.costPricePerCase}`
                              : product.costPrice
                                ? `₹${product.costPrice}`
                                : "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            {product.sellingPricePerPiece
                              ? `₹${product.sellingPricePerPiece}`
                              : product.sellingPrice
                                ? `₹${product.sellingPrice}`
                                : "—"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: "13px",
                              color: "var(--success)",
                            }}
                          >
                            {product.sellingPricePerCase
                              ? `₹${product.sellingPricePerCase}`
                              : "—"}
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
                                    costPricePerCase:
                                      product.costPricePerCase || "",
                                    sellingPricePerPiece:
                                      product.sellingPricePerPiece || "",
                                    sellingPricePerCase:
                                      product.sellingPricePerCase || "",
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
            {sortedProducts.length === 0 ? (
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
              sortedProducts.map((product) => {
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
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
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
                            MRP/piece
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              textDecoration: "line-through",
                              color: "var(--text-muted)",
                            }}
                          >
                            {product.mrp ? `₹${product.mrp}` : "—"}
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
                            Cost/case
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--danger)",
                              fontWeight: "600",
                            }}
                          >
                            {product.costPricePerCase
                              ? `₹${product.costPricePerCase}`
                              : "—"}
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
                            Sell/piece
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            {product.sellingPricePerPiece
                              ? `₹${product.sellingPricePerPiece}`
                              : product.sellingPrice
                                ? `₹${product.sellingPrice}`
                                : "—"}
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
                            Sell/case
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--success)",
                              fontWeight: "600",
                            }}
                          >
                            {product.sellingPricePerCase
                              ? `₹${product.sellingPricePerCase}`
                              : "—"}
                          </p>
                        </div>
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
                            costPrice:
                              restockModal.costPricePerCase ||
                              restockModal.costPrice ||
                              "",
                            supplierId: restockModal.primarySupplier || "",
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
                        onClick={() => handleDelete(product._id)}
                        color="var(--danger)"
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        🗑 Delete
                      </Btn>
                    </div>
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
              margin: "0 12px",
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
                { label: "MRP per Piece (₹)", key: "mrp", type: "number" },
                {
                  label: "Cost Price per Case (₹)",
                  key: "costPricePerCase",
                  type: "number",
                },
                {
                  label: "Selling Price per Piece (₹)",
                  key: "sellingPricePerPiece",
                  type: "number",
                },
                {
                  label: "Selling Price per Case (₹)",
                  key: "sellingPricePerCase",
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

                  {/* Brand field gets autocomplete, others get normal input */}
                  {field.key === "brand" ? (
                    <div style={{ position: "relative" }}>
                      <Input
                        type="text"
                        value={editProduct.brand || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditProduct({ ...editProduct, brand: val });
                          const saved = JSON.parse(
                            localStorage.getItem("savedBrands") || "[]",
                          );
                          const filtered = saved.filter((b) =>
                            b.toLowerCase().startsWith(val.toLowerCase()),
                          );
                          setBrandSuggestions(filtered);
                          setShowBrandDropdown(
                            filtered.length > 0 && val.trim().length > 0,
                          );
                        }}
                        onFocus={() => {
                          if (editProduct.brand?.trim()) {
                            const saved = JSON.parse(
                              localStorage.getItem("savedBrands") || "[]",
                            );
                            const filtered = saved.filter((b) =>
                              b
                                .toLowerCase()
                                .startsWith(editProduct.brand.toLowerCase()),
                            );
                            setBrandSuggestions(filtered);
                            setShowBrandDropdown(filtered.length > 0);
                          }
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowBrandDropdown(false), 150)
                        }
                        autoComplete="off"
                      />
                      {showBrandDropdown && brandSuggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            zIndex: 50,
                            width: "100%",
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            marginTop: "4px",
                            overflow: "hidden",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          }}
                        >
                          {brandSuggestions.map((brand) => (
                            <div
                              key={brand}
                              onMouseDown={() => {
                                setEditProduct({ ...editProduct, brand });
                                setShowBrandDropdown(false);
                                setBrandSuggestions([]);
                              }}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                fontSize: "13px",
                                borderBottom: "1px solid var(--border)",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--surface-2)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              {brand}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
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
                  )}
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
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Selling Type
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  background: "var(--surface-2)",
                  padding: "4px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setEditProduct({ ...editProduct, soldLoose: true })
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: editProduct?.soldLoose
                      ? "var(--accent)"
                      : "transparent",
                    color: editProduct?.soldLoose
                      ? "white"
                      : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Loose & Full Case
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditProduct({ ...editProduct, soldLoose: false })
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: !editProduct?.soldLoose
                      ? "var(--accent)"
                      : "transparent",
                    color: !editProduct?.soldLoose
                      ? "white"
                      : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  Full Case Only
                </button>
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
                  Last Cost/Case
                </p>
                <p style={{ fontWeight: "600" }}>
                  ₹
                  {restockModal.costPricePerCase || restockModal.costPrice || 0}{" "}
                  per case
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
