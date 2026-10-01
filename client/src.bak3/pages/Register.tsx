import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ token: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      setToken(res.token);
      navigate('/families/new');
    } catch {
      setError('Could not create your account. That phone number may already be registered.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Create an account</h1>
      <p>You only need this to register a family. Your phone number and a password are all that is required.</p>
      <form onSubmit={onSubmit}>
        <div className="field"><label>Full name *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Phone number *</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label>Email (optional)</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="field"><label>Password *</label><input required type="password" minLength={4} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Creating, please wait' : 'Create account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
