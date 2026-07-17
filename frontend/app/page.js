'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { productAPI, customerAPI, saleAPI } from '../lib/api';

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px', ...style
  }}>{children}</div>
);

const StatCard = ({ label, value, sub, color = 'var(--text)' }) => (
  <Card>
    <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
    <p style={{ fontSize: '28px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</p>
    {sub && <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{sub}</p>}
  </Card>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '10px 14px', fontSize: '12px'
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: '600' }}>
            {p.name}: ₹{Number(p.value).toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [productsRes, customersRes, salesRes] = await Promise.all([
        productAPI.getAll(),
        customerAPI.getAll(),
        saleAPI.getAll()
      ]);
      setProducts(productsRes.data);
      setCustomers(customersRes.data);
      setSales(salesRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  // Stats
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const todaySales = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPending = sales.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
  const lowStockProducts = products.filter(p => p.stock <= p.reorderThreshold);
  const topCustomers = [...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 5);
  const recentSales = sales.slice(0, 5);

  // Chart data — last 7 days revenue
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const daySales = sales.filter(s => new Date(s.createdAt).toDateString() === date.toDateString());
    const revenue = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const profit = daySales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    return { label, revenue, profit };
  });

  // Chart data — monthly revenue last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    const monthSales = sales.filter(s => {
      const d = new Date(s.createdAt);
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
    const revenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const profit = monthSales.reduce((sum, s) => sum + (s.totalProfit || 0), 0);
    return { label, revenue, profit };
  });

  const statusColors = { paid: 'var(--success)', unpaid: 'var(--danger)', partial: 'var(--warning)' };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/billing" style={{
          background: 'var(--accent)', color: 'white', padding: '8px 16px',
          borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600'
        }}>+ New Bill</Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} sub={`${sales.length} total bills`} />
        <StatCard label="Today's Revenue" value={`₹${todayRevenue.toLocaleString()}`} sub={`${todaySales.length} bills today`} color="var(--accent)" />
        <StatCard label="Gross Profit" value={`₹${totalProfit.toLocaleString()}`} sub={totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin` : '0%'} color="var(--success)" />
        <StatCard label="Pending Amount" value={`₹${totalPending.toLocaleString()}`} sub={`${sales.filter(s => s.paymentStatus !== 'paid').length} unpaid`} color="var(--danger)" />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '16px 20px'
        }}>
          <p style={{ fontWeight: '600', color: 'var(--danger)', marginBottom: '10px' }}>
            ⚠️ Low Stock — {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} need restocking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lowStockProducts.map(p => (
              <span key={p._id} style={{
                background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>{p.name} — {p.stock} units</span>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

        {/* Daily Revenue Chart */}
        <Card>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Daily Revenue</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Last 7 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366F1" strokeWidth={2} dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Monthly Revenue</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Last 6 months</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#22C55E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Sales + Top Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* Recent Sales */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontWeight: '600', fontSize: '14px' }}>Recent Sales</p>
            <Link href="/sales" style={{ color: 'var(--accent)', fontSize: '12px', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {recentSales.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No sales yet</p>
            ) : recentSales.map(sale => (
              <div key={sale._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '13px' }}>{sale.customerName}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {new Date(sale.createdAt).toLocaleDateString('en-IN')} · {sale.shopName}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: '600', fontSize: '13px' }}>₹{sale.totalAmount.toLocaleString()}</p>
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    background: `${statusColors[sale.paymentStatus]}18`,
                    color: statusColors[sale.paymentStatus]
                  }}>{sale.paymentStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Customers */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontWeight: '600', fontSize: '14px' }}>Top Customers</p>
            <Link href="/customers" style={{ color: 'var(--accent)', fontSize: '12px', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {topCustomers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No customers yet</p>
            ) : topCustomers.map((customer, index) => (
              <Link key={customer._id} href={`/customers/${customer._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px', height: '24px', background: 'var(--accent)',
                      borderRadius: '6px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'white', flexShrink: 0
                    }}>{index + 1}</span>
                    <div>
                      <p style={{ fontWeight: '500', fontSize: '13px', color: 'var(--text)' }}>{customer.name}</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{customer.shopName}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: '600', fontSize: '13px', color: 'var(--success)' }}>
                    ₹{customer.totalPurchases.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { href: '/billing', label: 'Create Bill', icon: '🧾', color: '#6366F1' },
          { href: '/products', label: 'Manage Inventory', icon: '📦', color: '#22C55E' },
          { href: '/customers', label: 'Manage Customers', icon: '👥', color: '#F59E0B' },
          { href: '/reports', label: 'View Reports', icon: '📊', color: '#EC4899' }
        ].map(action => (
          <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer'
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.background = 'var(--surface-2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.background = 'var(--surface)';
              }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>{action.icon}</p>
              <p style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text)' }}>{action.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}