import { useState, FormEvent, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const phoneRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    phoneRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      });
      setToken(res.token);
      navigate('/');
    } catch {
      setError('Incorrect phone number or password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark">
          <img src="/mark.jpg" alt="" />
        </div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-sub">Log in to register a family or moderate.</p>

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="field">
            <label>Phone number</label>
            <input
              ref={phoneRef}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <div className="field error">{error}</div>}

          <button className="btn login-btn" type="submit" disabled={saving}>
            {saving ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="login-foot">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}