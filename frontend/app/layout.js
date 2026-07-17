"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, logout, isAuthenticated } from "../lib/auth";
import "./globals.css";

const NAV_LINKS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Inventory", icon: "📦" },
  { href: "/suppliers", label: "Suppliers", icon: "🏭" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/billing", label: "Billing", icon: "🧾" },
  { href: "/sales", label: "Sales", icon: "💰" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/alerts", label: "Alerts", icon: "⚠️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/login") {
      const u = getUser();
      if (!u || !isAuthenticated()) {
        router.push("/login");
      } else {
        setUser(u);
      }
    }
  }, [pathname]);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login";

  return (
    <html lang="en" style={{ background: '#09090B' }} suppressHydrationWarning={true}>
      <head>
        <title>WholesaleHub</title>
        <meta name="description" content="FMCG Wholesale Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{ background: "#09090B", color: "#FAFAFA", minHeight: "100vh" }}
        suppressHydrationWarning={true}
      >
        {!isLoginPage && user && (
          <>
            {/* Navbar */}
            <nav
              style={{
                background: "var(--surface)",
                borderBottom: "1px solid var(--border)",
                padding: "0 20px",
                height: "52px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                zIndex: 200,
              }}
            >
              {/* Logo */}
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    background: "var(--accent)",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  P
                </div>
                <span
                  style={{
                    fontWeight: "600",
                    color: "var(--text)",
                    fontSize: "15px",
                  }}
                >
                  WholesaleHub
                </span>
              </Link>

              {/* Desktop Links */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  overflowX: "auto",
                }}
                className="desktop-links"
              >
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "6px",
                        color: isActive ? "var(--text)" : "var(--text-muted)",
                        background: isActive ? "var(--border)" : "transparent",
                        textDecoration: "none",
                        fontSize: "12px",
                        fontWeight: isActive ? "600" : "500",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop User + Logout */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexShrink: 0,
                }}
                className="desktop-links"
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <span
                    style={{
                      color: "var(--text)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {user?.businessName}
                  </span>
                  <span
                    style={{ color: "var(--text-muted)", fontSize: "11px" }}
                  >
                    @{user?.username}
                  </span>
                </div>
                <button
                  onClick={logout}
                  style={{
                    background: "var(--border)",
                    color: "var(--text-muted)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Logout
                </button>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="hamburger"
                style={{
                  background: "var(--border)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  display: "none",
                  flexDirection: "column",
                  gap: "4px",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "var(--text)",
                    borderRadius: "2px",
                    transform: menuOpen
                      ? "rotate(45deg) translate(4px, 4px)"
                      : "none",
                    transition: "transform 200ms ease",
                  }}
                />
                <div
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "var(--text)",
                    borderRadius: "2px",
                    opacity: menuOpen ? 0 : 1,
                    transition: "opacity 200ms ease",
                  }}
                />
                <div
                  style={{
                    width: "18px",
                    height: "2px",
                    background: "var(--text)",
                    borderRadius: "2px",
                    transform: menuOpen
                      ? "rotate(-45deg) translate(4px, -4px)"
                      : "none",
                    transition: "transform 200ms ease",
                  }}
                />
              </button>
            </nav>

            {/* Mobile Menu Dropdown */}
            {menuOpen && (
              <>
                {/* Backdrop */}
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 150,
                  }}
                  className="mobile-only"
                />

                {/* Menu Panel */}
                <div
                  style={{
                    position: "fixed",
                    top: "52px",
                    left: 0,
                    right: 0,
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    zIndex: 160,
                    padding: "8px",
                  }}
                  className="mobile-only"
                >
                  {NAV_LINKS.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "8px",
                          textDecoration: "none",
                          marginBottom: "2px",
                          background: isActive
                            ? "rgba(99,102,241,0.1)"
                            : "transparent",
                          color: isActive ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        <span style={{ fontSize: "18px" }}>{link.icon}</span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: isActive ? "600" : "400",
                          }}
                        >
                          {link.label}
                        </span>
                        {isActive && (
                          <div
                            style={{
                              marginLeft: "auto",
                              width: "6px",
                              height: "6px",
                              background: "var(--accent)",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </Link>
                    );
                  })}

                  {/* Divider */}
                  <div
                    style={{
                      height: "1px",
                      background: "var(--border)",
                      margin: "8px 0",
                    }}
                  />

                  {/* User info + Logout */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                    }}
                  >
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "13px" }}
                    >
                      👤 {user?.username}
                    </span>
                    <button
                      onClick={logout}
                      style={{
                        background: "var(--danger)",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 14px",
                        fontSize: "13px",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <main
          style={{
            padding: isLoginPage ? "0" : "24px 20px",
            maxWidth: isLoginPage ? "100%" : "1200px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          {children}
        </main>

        <style>{`
          @media (max-width: 768px) {
            .desktop-links { display: none !important; }
            .hamburger { display: flex !important; }
            .mobile-only { display: block !important; }
          }
          @media (min-width: 769px) {
            .hamburger { display: none !important; }
            .mobile-only { display: none !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
