'use client';
import { useState, useEffect } from 'react';
import { getUser, logout } from '../../lib/auth';
import { authAPI } from '../../lib/api';

const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '20px', ...style
  }}>{children}</div>
);

const Input = ({ style = {}, ...props }) => (
  <input style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text)', borderRadius: '8px', padding: '8px 12px',
    fontSize: '13px', outline: 'none', width: '100%', ...style
  }} {...props} />
);

const labelStyle = {
  fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px',
  display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em'
};

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Access code state
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeLoading, setAccessCodeLoading] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [accessCodeSuccess, setAccessCodeSuccess] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);

  const handleChangePassword = async () => {
    setError(''); setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields required'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
    setLoading(false);
  };

  const fetchAccessCode = async () => {
    setAccessCodeLoading(true);
    setAccessCodeError('');
    try {
      const res = await authAPI.getAccessCode();
      setAccessCode(res.data.accessCode);
      setShowAccessCode(true);
    } catch (err) {
      setAccessCodeError(err.response?.data?.error || 'Not authorized');
    }
    setAccessCodeLoading(false);
  };

  const regenerateAccessCode = async () => {
    if (!confirm('Generate a new access code? The old one will stop working.')) return;
    setAccessCodeLoading(true);
    setAccessCodeError('');
    try {
      const res = await authAPI.regenerateAccessCode();
      setAccessCode(res.data.accessCode);
      setAccessCodeSuccess('New access code generated!');
      setTimeout(() => setAccessCodeSuccess(''), 3000);
    } catch (err) {
      setAccessCodeError(err.response?.data?.error || 'Not authorized');
    }
    setAccessCodeLoading(false);
  };
  useEffect(() => {
    setUser(getUser());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', width: '100%' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Settings</h1>

      {/* Account Info */}
      <Card>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '16px' }}>Account</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--accent)',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '20px', fontWeight: '700', color: 'white'
          }}>
            {user?.businessName?.[0]?.toUpperCase()}
          </div> 
          <div>
            <p style={{ fontWeight: '600', fontSize: '15px' }}>{user?.businessName}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>@{user?.username}</p>
            <p style={{ color: user?.isAdmin ? 'var(--accent)' : 'var(--success)', fontSize: '11px', marginTop: '4px' }}>
              {user?.isAdmin ? '👑 Admin Account' : '✓ Active Account'}
            </p>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '16px' }}>Change Password</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--danger)', fontSize: '13px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--success)', fontSize: '13px' }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Current Password</label>
            <Input type="password" placeholder="Enter current password"
              value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <Input type="password" placeholder="Min 8 characters"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <Input type="password" placeholder="Repeat new password"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button onClick={handleChangePassword} disabled={loading} style={{
            background: 'var(--accent)', color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px', fontSize: '13px',
            fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '4px'
          }}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </Card>

      {/* Access Code — admin only */}
      {user?.isAdmin && (
        <Card>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>
            👑 Access Code Management
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
            Share this code with people you want to give access to WholesaleHub.
            Regenerate to stop new registrations with the old code.
          </p>

          {accessCodeError && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--danger)', fontSize: '13px' }}>
              {accessCodeError}
            </div>
          )}
          {accessCodeSuccess && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', color: 'var(--success)', fontSize: '13px' }}>
              {accessCodeSuccess}
            </div>
          )}

          {showAccessCode && accessCode && (
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--accent)',
              borderRadius: '8px', padding: '16px', marginBottom: '16px',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Access Code
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent)', letterSpacing: '4px' }}>
                {accessCode}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            {!showAccessCode ? (
              <button onClick={fetchAccessCode} disabled={accessCodeLoading} style={{
                flex: 1, background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: '8px', padding: '10px',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>
                {accessCodeLoading ? 'Loading...' : '👁 View Access Code'}
              </button>
            ) : (
              <>
                <button onClick={() => {
                  navigator.clipboard.writeText(accessCode);
                  setAccessCodeSuccess('Copied to clipboard!');
                  setTimeout(() => setAccessCodeSuccess(''), 2000);
                }} style={{
                  flex: 1, background: 'var(--success)', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                }}>
                  📋 Copy Code
                </button>
                <button onClick={regenerateAccessCode} disabled={accessCodeLoading} style={{
                  flex: 1, background: 'var(--warning)', color: 'white',
                  border: 'none', borderRadius: '8px', padding: '10px',
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                }}>
                  🔄 Regenerate
                </button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* App Info */}
      <Card>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '16px' }}>App Info</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'App Name', value: 'WholesaleHub' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Stack', value: 'Next.js + Node.js + MongoDB' }
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '13px', padding: '8px 0',
              borderBottom: '1px solid var(--border)'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontWeight: '500' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Sign Out */}
      <Card style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: 'var(--danger)' }}>
          Sign Out
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
          You will be redirected to the login page.
        </p>
        <button onClick={logout} style={{
          background: 'var(--danger)', color: 'white', border: 'none',
          borderRadius: '8px', padding: '8px 20px', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer'
        }}>Sign Out</button>
      </Card>
    </div>
  );
}