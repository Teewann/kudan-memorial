import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ token: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
      setToken(res.token);
      navigate('/');
    } catch {
      setError('Incorrect phone number or password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Log in</h1>
      <form onSubmit={onSubmit}>
        <div className="field"><label>Phone number</label><input required value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="field"><label>Password</label><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Logging in, please wait' : 'Log in'}</button>
      </form>
      <p>No account yet? <Link to="/register">Register</Link></p>
    </div>
  );
}
