import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Family { id: number; name: string; ward: string; headName: string | null; memberCount: number; }

export default function Families() {
  const [items, setItems] = useState<Family[] | null>(null);

  useEffect(() => {
    api<{ items: Family[] }>('/api/families').then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <h1>Families</h1>
      <Link to="/families/new" className="btn" style={{ marginBottom: '1rem', display: 'inline-flex' }}>Register a Family</Link>
      {items === null && <div className="skeleton" />}
      {items?.length === 0 && <p>No families registered yet.</p>}
      {items?.map((f) => (
        <Link key={f.id} to={`/families/${f.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <strong>{f.name}</strong>
          <div className="badge">{f.ward}</div>
          <div style={{ color: 'var(--color-gray)' }}>{f.memberCount} member(s) recorded</div>
        </Link>
      ))}
    </div>
  );
}
