import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string> = { name, phone, password };
      if (email.trim()) body.email = email.trim();

      const res = await api<{ token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setToken(res.token);
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('phone_taken')) {
        setError('That phone number is already registered. Try logging in instead.');
      } else if (msg.includes('invalid_input')) {
        setError('Please check your name, phone, and password. Password must be at least 4 characters.');
      } else {
        setError('Could not create your account. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Create an account</h1>
      <p className="muted">
        You only need this to register a family. Your phone number and a password are all that is required.
      </p>
      <form onSubmit={onSubmit} autoComplete="off">
        <div className="field">
          <label>Full name <span className="req">*</span></label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Phone number <span className="req">*</span></label>
          <input
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Password <span className="req">*</span></label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={4}
          />
        </div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}