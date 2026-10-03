import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';

interface Announcement {
  id: number;
  name: string;
  dateOfDeath: string;
  note: string | null;
  burialTime: string | null;
  burialPlace: string | null;
  createdAt: string;
}

export default function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<{ items: Announcement[] }>(`/api/announcements?page=${page}&limit=${limit}`)
      .then((res) => setItems(res.items))
      .catch(() => setError('Could not load announcements.'))
      .finally(() => setLoading(false));
  }, [page, limit]);

  return (
    <div>
      <h1>Announcements</h1>
      
            {loading && <div className="skeleton" />}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">No announcements right now.</p>
      )}

      {items.map((a) => (
        <Link
          key={a.id}
          to={`/announcements/${a.id}`}
          className="card"
          style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}
        >
          <h2 style={{ marginBottom: 4 }}>{a.name}</h2>
          <div className="muted" style={{ fontSize: '0.9rem', marginBottom: 8 }}>
            Died {new Date(a.dateOfDeath).toLocaleDateString()}
          </div>
          {a.burialPlace && <p style={{ margin: 0 }}><strong>Burial:</strong> {a.burialPlace}</p>}
          {a.burialTime && <p style={{ margin: 0 }}><strong>Time:</strong> {a.burialTime}</p>}
        </Link>
      ))}

      {items.length === limit && (
        <div className="pagination">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <span>Page {page}</span>
          <button className="btn secondary" onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}