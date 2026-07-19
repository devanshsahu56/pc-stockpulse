'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '../../lib/auth';

const Input = ({ style = {}, ...props }) => (
  <input style={{
    background: '#09090B', border: '1px solid #27272A',
    color: '#FAFAFA', borderRadius: '8px', padding: '10px 14px',
    fontSize: '14px', outline: 'none', width: '100%', ...style
  }} {...props} />
);

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regAccessCode, setRegAccessCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      await register(regUsername, regPassword, regBusinessName, regAccessCode);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#09090B', padding: '20px'
    }}>
      <div style={{
        background: '#18181B', border: '1px solid #27272A',
        borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', background: '#6366F1',
            borderRadius: '14px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '26px', fontWeight: '700',
            color: 'white', margin: '0 auto 14px'
          }}>PC</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#FAFAFA' }}>
            WholesaleHub
          </h1>
          <p style={{ color: '#71717A', fontSize: '13px', marginTop: '4px' }}>
            FMCG Wholesale Management
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          background: '#09090B', borderRadius: '8px', padding: '4px'
        }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                background: tab === t ? '#18181B' : 'transparent',
                color: tab === t ? '#FAFAFA' : '#71717A'
              }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
            color: '#EF4444', fontSize: '13px'
          }}>{error}</div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <Input type="text" placeholder="Enter username"
                value={username} onChange={e => setUsername(e.target.value)}
                required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Input type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', fontSize: '16px', padding: 0 }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#6366F1', color: 'white', border: 'none',
              borderRadius: '8px', padding: '12px', fontSize: '14px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '4px'
            }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Name</label>
              <Input type="text" 
                value={regBusinessName} onChange={e => setRegBusinessName(e.target.value)}
                required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <Input type="text" placeholder="Choose a username"
                value={regUsername} onChange={e => setRegUsername(e.target.value)}
                required />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <Input type="password" placeholder="Min 8 characters"
                value={regPassword} onChange={e => setRegPassword(e.target.value)}
                required />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password</label>
              <Input type="password" placeholder="Repeat password"
                value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                required />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#71717A', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Code</label>
              <Input type="text" placeholder="Enter access code"
                value={regAccessCode} onChange={e => setRegAccessCode(e.target.value)}
                required />
              <p style={{ fontSize: '11px', color: '#3F3F46', marginTop: '4px' }}>
                Contact admin to get the access code
              </p>
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#6366F1', color: 'white', border: 'none',
              borderRadius: '8px', padding: '12px', fontSize: '14px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, marginTop: '4px'
            }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}