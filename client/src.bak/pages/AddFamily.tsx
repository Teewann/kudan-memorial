import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';

export default function AddFamily() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', headName: '', ward: '', phone: '', history: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn()) {
    return <p>Please <Link to="/login">log in</Link> to register a family.</p>;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ family: { id: number } }>('/api/families', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/families/${res.family.id}`);
    } catch {
      setError('Could not save this family. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Register a Family</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Family name * (e.g. "Gidan Malam Audu")</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Head of family</label>
          <input value={form.headName} onChange={(e) => setForm({ ...form, headName: e.target.value })} />
        </div>
        <div className="field">
          <label>Ward / area *</label>
          <input required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Family history (optional)</label>
          <textarea value={form.history} onChange={(e) => setForm({ ...form, history: e.target.value })} />
        </div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Register family'}</button>
      </form>
    </div>
  );
}
