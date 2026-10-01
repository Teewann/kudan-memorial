import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

interface PendingPerson {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfDeath: string;
  submittedByName: string;
  submittedByPhone: string;
  photoUrl: string | null;
  bio: string | null;
}

interface PendingCondolence {
  id: number;
  deceasedId: number;
  authorName: string;
  message: string;
  createdAt: string;
}

export default function Moderation() {
  const [tab, setTab] = useState<'deceased' | 'condolences'>('deceased');

  return (
    <div>
      <h1>Moderation</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          className={tab === 'deceased' ? 'btn' : 'btn secondary'}
          onClick={() => setTab('deceased')}
        >
          Deceased submissions
        </button>
        <button
          className={tab === 'condolences' ? 'btn' : 'btn secondary'}
          onClick={() => setTab('condolences')}
        >
          Condolences
        </button>
      </div>

      {tab === 'deceased' && <DeceasedTab />}
      {tab === 'condolences' && <CondolencesTab />}
    </div>
  );
}

function DeceasedTab() {
  const [items, setItems] = useState<PendingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: PendingPerson[] }>('/api/moderation/pending');
      setItems(res.items);
    } catch {
      setError('Could not load pending submissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'approve' | 'reject') {
    if (busy) return;
    setBusy(id);
    try {
      await api(`/api/moderation/${id}/${action}`, { method: 'PATCH' });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Action failed. Try again.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No pending submissions right now.</p>;

  return (
    <div>
      {items.map((p) => (
        <div key={p.id} className="card">
          <h2>{p.fullName}{p.hausaName ? ` (${p.hausaName})` : ''}</h2>
          {p.photoUrl && <img src={p.photoUrl} alt="" style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }} />}
          <p><strong>Ward:</strong> {p.ward}</p>
          <p><strong>Date of death:</strong> {new Date(p.dateOfDeath).toLocaleDateString()}</p>
          <p><strong>Submitted by:</strong> {p.submittedByName} ({p.submittedByPhone})</p>
          {p.bio && <p>{p.bio}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" disabled={busy === p.id} onClick={() => act(p.id, 'approve')}>
              {busy === p.id ? 'Working...' : 'Approve'}
            </button>
            <button className="btn secondary" disabled={busy === p.id} onClick={() => act(p.id, 'reject')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CondolencesTab() {
  const [items, setItems] = useState<PendingCondolence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: PendingCondolence[] }>('/api/condolences/pending');
      setItems(res.items);
    } catch {
      setError('Could not load pending condolences.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'approve' | 'reject') {
    if (busy) return;
    setBusy(id);
    try {
      await api(`/api/condolences/${id}/${action}`, { method: 'PATCH' });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Action failed. Try again.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No pending condolences right now.</p>;

  return (
    <div>
      {items.map((c) => (
        <div key={c.id} className="card">
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            For <Link to={`/deceased/${c.deceasedId}`}>record #{c.deceasedId}</Link>, {new Date(c.createdAt).toLocaleDateString()}
          </p>
          <p style={{ fontWeight: 600 }}>{c.authorName}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{c.message}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn" disabled={busy === c.id} onClick={() => act(c.id, 'approve')}>
              {busy === c.id ? 'Working...' : 'Approve'}
            </button>
            <button className="btn secondary" disabled={busy === c.id} onClick={() => act(c.id, 'reject')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}