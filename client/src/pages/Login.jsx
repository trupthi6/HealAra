import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import HealAraLogo from '../components/HealAraLogo';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter both email and password.');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back!');
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } catch (err) {
      // error toast handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FFFE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 80,
        paddingBottom: 40,
        paddingLeft: 16,
        paddingRight: 16,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Max-width wrapper */}
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo lockup card */}
        <div
          style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: 24,
            padding: 40,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 52,
          }}
        >
          {/* Orbit mark */}
          <HealAraLogo size="lg" showWordmark={false} />

          {/* Vertical rule */}
          <div style={{ width: 1, height: 150, background: '#E2E8F0', flexShrink: 0 }} />

          {/* Wordmark */}
          <div>
            <div style={{ lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  fontSize: 64,
                  fontWeight: 100,
                  color: '#0F172A',
                  letterSpacing: -4,
                  display: 'block',
                  lineHeight: 1,
                }}
              >Heal</span>
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Arial, sans-serif",
                  fontSize: 64,
                  fontWeight: 100,
                  color: '#0D9488',
                  letterSpacing: -4,
                  display: 'block',
                  lineHeight: 1,
                }}
              >Ara</span>
            </div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: '#94A3B8',
                letterSpacing: 4,
                marginTop: 14,
                fontFamily: "'Inter', sans-serif",
              }}
            >MIND · BODY · NUTRITION · AI</p>
          </div>
        </div>

        {/* Login form card */}
        <div
          style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 32,
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', margin: 0 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 24 }}>
            Sign in to your HealAra account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@healara.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#0D9488';
                  e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 14px',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#0F172A',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0D9488';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13,148,136,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 0',
                background: loading ? '#5EEAD4' : '#0D9488',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: "'Inter', sans-serif",
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0F766E'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0D9488'; }}
            >
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748B', marginTop: 20 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#0D9488', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
