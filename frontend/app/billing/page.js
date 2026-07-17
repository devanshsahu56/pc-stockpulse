"use client";
import { useState } from "react";
import { customerAPI, productAPI, saleAPI } from "../../lib/api";

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
      padding: "8px 16px",
      borderRadius: "8px",
      fontSize: "13px",
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

export default function BillingPage() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successBill, setSuccessBill] = useState(null);
  const [isWalkIn, setIsWalkIn] = useState(false);

  const handleCustomerSearch = async (e) => {
    const query = e.target.value;
    setCustomerSearch(query);
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await customerAPI.search(query);
      setCustomerResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setCustomerResults([]);
  };

  const handleProductSearch = async (e) => {
    const query = e.target.value;
    setProductSearch(query);
    if (!query.trim()) {
      setProductResults([]);
      return;
    }
    try {
      const res = await productAPI.search(query);
      setProductResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addToBill = (product) => {
    if (billItems.find((i) => i.productId === product._id)) return;
    const fullCaseVariant = product.variants?.[0] || null;
    const defaultVariant = product.soldLoose ? "loose" : "fullcase";
    const defaultPrice = product.soldLoose
      ? product.sellingPrice
      : fullCaseVariant?.price || product.sellingPrice;
    const defaultMrp = product.soldLoose
      ? product.mrp
      : fullCaseVariant
        ? product.mrp * fullCaseVariant.quantity
        : product.mrp;
    setBillItems([
      ...billItems,
      {
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        soldLoose: product.soldLoose,
        unitsPerCase: product.unitsPerCase || 1,
        stock: product.stock,
        variants: product.variants || [],
        fullCaseVariant,
        selectedVariant: defaultVariant,
        unitPrice: defaultPrice,
        displayMrp: defaultMrp,
        quantity: 1,
        discountType: "flat",
        discountValue: 0,
      },
    ]);
    setProductSearch("");
    setProductResults([]);
  };

  const handleVariantChange = (productId, variantType) => {
    setBillItems(
      billItems.map((item) => {
        if (item.productId !== productId) return item;
        if (variantType === "loose")
          return {
            ...item,
            selectedVariant: "loose",
            unitPrice: item.sellingPrice,
            displayMrp: item.mrp,
          };
        const variant = item.fullCaseVariant;
        return {
          ...item,
          selectedVariant: "fullcase",
          unitPrice: variant?.price || item.sellingPrice,
          displayMrp: variant ? item.mrp * variant.quantity : item.mrp,
        };
      }),
    );
  };

  const updateItem = (productId, key, value) => {
    setBillItems(
      billItems.map((item) =>
        item.productId === productId ? { ...item, [key]: value } : item,
      ),
    );
  };

  const removeFromBill = (productId) =>
    setBillItems(billItems.filter((i) => i.productId !== productId));

  const getLineTotal = (item) => {
    const lineTotal =
      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const disc = Number(item.discountValue) || 0;
    const discAmount =
      item.discountType === "percentage" ? (lineTotal * disc) / 100 : disc;
    return Math.max(0, lineTotal - discAmount);
  };

  const getDiscountAmount = (item) => {
    const lineTotal =
      (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    const disc = Number(item.discountValue) || 0;
    return item.discountType === "percentage" ? (lineTotal * disc) / 100 : disc;
  };

  const subtotal = billItems.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const totalDiscount = billItems.reduce(
    (sum, item) => sum + getDiscountAmount(item),
    0,
  );
  const totalAmount = subtotal - totalDiscount;

  const handleSubmitBill = async () => {
    if (!isWalkIn && !selectedCustomer) {
      alert("Select a customer or choose Walk-in");
      return;
    }
    if (billItems.length === 0) {
      alert("Add at least one product");
      return;
    }
    for (const item of billItems) {
      if (!item.quantity || Number(item.quantity) <= 0) {
        alert(`Enter valid quantity for ${item.productName}`);
        return;
      }
    }
    if (paymentStatus === "partial") {
      if (!amountPaid || Number(amountPaid) <= 0) {
        alert("Enter amount paid");
        return;
      }
      if (Number(amountPaid) >= totalAmount) {
        alert("Use Paid instead");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await saleAPI.create({
        customerId: isWalkIn ? null : selectedCustomer._id,
        isWalkIn,
        items: billItems.map((item) => ({
          productId: item.productId,
          variantName: item.selectedVariant === "loose" ? "Loose" : "Full Case",
          variantQuantity:
            item.selectedVariant === "loose"
              ? 1
              : item.fullCaseVariant?.quantity || 1,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discountType: item.discountType,
          discountValue: Number(item.discountValue) || 0,
        })),
        paymentStatus,
        amountPaid: Number(amountPaid) || 0,
        notes,
      });
      setSuccessBill(res.data);
      setSelectedCustomer(null);
      setBillItems([]);
      setNotes("");
      setPaymentStatus("paid");
      setAmountPaid("");
      setIsWalkIn(false);
    } catch (err) {
      alert("Error: " + err.response?.data?.error);
    }
    setLoading(false);
  };

  // Success Screen
  if (successBill) {
    return (
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
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
                {successBill.customerName}
              </p>
              <p style={{ color: "#444" }}>{successBill.shopName}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#666", marginBottom: "4px" }}>Date</p>
              <p style={{ fontWeight: "500", color: "#111" }}>
                {new Date().toLocaleDateString("en-IN")}
              </p>
              <p
                style={{ color: "#666", marginTop: "8px", marginBottom: "4px" }}
              >
                Payment
              </p>
              <p
                style={{
                  fontWeight: "600",
                  color:
                    successBill.paymentStatus === "paid"
                      ? "#16a34a"
                      : successBill.paymentStatus === "unpaid"
                        ? "#dc2626"
                        : "#d97706",
                  textTransform: "capitalize",
                }}
              >
                {successBill.paymentStatus}
              </p>
              {successBill.paymentStatus === "partial" && (
                <>
                  <p style={{ color: "#666", fontSize: "12px" }}>
                    Paid: ₹{successBill.amountPaid.toLocaleString()}
                  </p>
                  <p style={{ color: "#dc2626", fontSize: "12px" }}>
                    Due: ₹{successBill.remainingAmount.toLocaleString()}
                  </p>
                </>
              )}
              {successBill.paymentStatus === "unpaid" && (
                <p style={{ color: "#dc2626", fontSize: "12px" }}>
                  Due: ₹{successBill.totalAmount.toLocaleString()}
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
              {successBill.items.map((item, i) => (
                <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                  <td
                    style={{
                      padding: "8px 10px",
                      color: "#666",
                      textAlign: "right",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <p style={{ fontWeight: "500", color: "#111" }}>
                      {item.productName}
                    </p>
                    <p style={{ color: "#666", fontSize: "11px" }}>
                      {item.brand}
                    </p>
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
                  <td
                    style={{
                      padding: "8px 10px",
                      textAlign: "right",
                      color: "#dc2626",
                    }}
                  >
                    {item.discountAmount > 0
                      ? `- ₹${item.discountAmount.toFixed(2)}`
                      : "—"}
                  </td>
                  <td
                    style={{
                      padding: "8px 10px",
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
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
              fontSize: "13px",
              borderTop: "1px solid #eee",
              paddingTop: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "200px",
              }}
            >
              <span style={{ color: "#666" }}>Subtotal</span>
              <span>₹{successBill.subtotal.toLocaleString()}</span>
            </div>
            {successBill.totalDiscount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "200px",
                  color: "#dc2626",
                }}
              >
                <span>Discount</span>
                <span>- ₹{successBill.totalDiscount.toFixed(2)}</span>
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
                ₹{successBill.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {successBill.notes && (
            <p
              style={{
                color: "#666",
                fontSize: "12px",
                marginTop: "16px",
                borderTop: "1px solid #eee",
                paddingTop: "12px",
              }}
            >
              Notes: {successBill.notes}
            </p>
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
          <button
            onClick={() => setSuccessBill(null)}
            style={{
              flex: 1,
              background: "var(--success)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            + New Bill
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Billing</h1>

      {/* Customer */}
      <Card>
        <p
          style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}
        >
          Customer
        </p>

        {/* Walk-in Toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button
            onClick={() => {
              setIsWalkIn(false);
              setSelectedCustomer(null);
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              background: !isWalkIn ? "var(--accent)" : "var(--border)",
              color: "white",
            }}
          >
            Registered Customer
          </button>
          <button
            onClick={() => {
              setIsWalkIn(true);
              setSelectedCustomer(null);
              setCustomerSearch("");
              setCustomerResults([]);
            }}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              background: isWalkIn ? "var(--warning)" : "var(--border)",
              color: "white",
            }}
          >
            Walk-in Customer
          </button>
        </div>

        {isWalkIn ? (
          <div
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "8px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "20px" }}>🚶</span>
            <div>
              <p
                style={{
                  fontWeight: "600",
                  fontSize: "13px",
                  color: "var(--warning)",
                }}
              >
                Walk-in Customer
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                No customer details required — bill will be saved as walk-in
              </p>
            </div>
          </div>
        ) : selectedCustomer ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--surface-2)",
              border: "1px solid var(--accent)",
              borderRadius: "8px",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  background: "var(--accent)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {selectedCustomer.name[0]}
              </div>
              <div>
                <p style={{ fontWeight: "600", fontSize: "13px" }}>
                  {selectedCustomer.name}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                  {selectedCustomer.shopName} · {selectedCustomer.phone}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              style={{
                background: "none",
                border: "none",
                color: "var(--danger)",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <Input
              placeholder="Search customer..."
              value={customerSearch}
              onChange={handleCustomerSearch}
            />
            {customerResults.length > 0 && (
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
                {customerResults.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => selectCustomer(c)}
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
                    <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {c.shopName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Products */}
      <Card>
        <p
          style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}
        >
          Products
        </p>
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Input
            placeholder="Search product..."
            value={productSearch}
            onChange={handleProductSearch}
          />
          {productResults.length > 0 && (
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
              {productResults.map((p) => (
                <div
                  key={p._id}
                  onClick={() => addToBill(p)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div>
                    <p style={{ fontWeight: "500", fontSize: "13px" }}>
                      {p.name}
                    </p>
                    <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                      {p.brand}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        textDecoration: "line-through",
                      }}
                    >
                      ₹{p.mrp}
                    </p>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "var(--success)",
                        fontSize: "13px",
                      }}
                    >
                      ₹{p.sellingPrice}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {billItems.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "20px",
              fontSize: "13px",
            }}
          >
            No products added yet
          </p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="desktop-links" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                {/* your existing table code stays here exactly as is */}
              </table>
            </div>

            {/* Mobile Cards */}
            <div
              className="mobile-only"
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {billItems.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  {/* Product name + remove button */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: "600", fontSize: "14px" }}>
                        {item.productName}
                      </p>
                      <p
                        style={{ color: "var(--text-muted)", fontSize: "12px" }}
                      >
                        {item.brand}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromBill(item.productId)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        fontSize: "20px",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Price + Qty side by side */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "unitPrice",
                            e.target.value,
                          )
                        }
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          fontSize: "13px",
                          outline: "none",
                          width: "100%",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.productId, "quantity", e.target.value)
                        }
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          fontSize: "13px",
                          outline: "none",
                          width: "100%",
                          textAlign: "center",
                        }}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Discount + Total */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={item.discountType}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "discountType",
                            e.target.value,
                          )
                        }
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "6px",
                          padding: "6px 4px",
                          fontSize: "12px",
                          outline: "none",
                          width: "50px",
                        }}
                      >
                        <option value="flat">₹</option>
                        <option value="percentage">%</option>
                      </select>
                      <input
                        type="number"
                        value={item.discountValue}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            "discountValue",
                            e.target.value,
                          )
                        }
                        placeholder="Disc"
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--text)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          fontSize: "12px",
                          outline: "none",
                          width: "70px",
                        }}
                        min="0"
                      />
                    </div>
                    <p
                      style={{
                        fontWeight: "700",
                        fontSize: "16px",
                        color: "var(--success)",
                      }}
                    >
                      ₹{getLineTotal(item).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Payment */}
      <Card>
        <p
          style={{ fontWeight: "600", fontSize: "14px", marginBottom: "12px" }}
        >
          Payment
        </p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {[
            { val: "paid", label: "Paid", color: "var(--success)" },
            { val: "unpaid", label: "Unpaid", color: "var(--danger)" },
            { val: "partial", label: "Partial", color: "var(--warning)" },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => setPaymentStatus(opt.val)}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "500",
                background:
                  paymentStatus === opt.val ? opt.color : "var(--border)",
                color:
                  paymentStatus === opt.val ? "white" : "var(--text-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {paymentStatus === "partial" && (
          <div
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "var(--warning)",
                fontWeight: "600",
                marginBottom: "12px",
              }}
            >
              Partial Payment
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <label style={labelStyle}>Amount Paid (₹)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  min="0"
                  max={totalAmount}
                />
              </div>
              <div>
                <label style={labelStyle}>Remaining (₹)</label>
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "var(--danger)",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  ₹
                  {Math.max(
                    0,
                    totalAmount - (Number(amountPaid) || 0),
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Notes (optional)</label>
          <Input
            placeholder="Any notes about this bill..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      {/* Summary + Submit */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "32px",
                fontSize: "13px",
                color: "var(--text-muted)",
              }}
            >
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "32px",
                  fontSize: "13px",
                  color: "var(--danger)",
                }}
              >
                <span>Discount</span>
                <span>- ₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "32px",
                fontSize: "20px",
                fontWeight: "700",
                color: "var(--success)",
              }}
            >
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
          <Btn
            onClick={handleSubmitBill}
            disabled={loading}
            style={{
              padding: "12px 32px",
              fontSize: "15px",
              fontWeight: "700",
            }}
          >
            {loading ? "Creating..." : "Generate Bill"}
          </Btn>
        </div>
      </Card>
    </div>
  );
}
