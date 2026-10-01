import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Person {
  id: number; fullName: string; ward: string;
  dateOfDeath: string; photoUrl: string | null;
}

export default function Home() {
  const [recent, setRecent] = useState<Person[] | null>(null);
  const [onThisDay, setOnThisDay] = useState<Person[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    api<{ items: Person[]; total: number }>('/api/deceased?limit=6&sort=newest')
      .then((r) => { setRecent(r.items); setTotal(r.total); })
      .catch(() => { setRecent([]); setTotal(0); });

    api<{ items: Person[] }>('/api/deceased/on-this-day')
      .then((r) => setOnThisDay(r.items))
      .catch(() => setOnThisDay([]));
  }, []);

  return (
    <div>
      <h1>Kudan Memorial</h1>
      <p>A lasting record of the people of Kudan, so the town never forgets.</p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
        <Link to="/deceased/new" className="btn">Register a Deceased</Link>
        <Link to="/families/new" className="btn secondary">Register a Family</Link>
      </div>

      {total !== null && (
        <p className="muted">
          {total === 0
            ? 'No records yet. Be the first to register someone.'
            : `${total} ${total === 1 ? 'person' : 'people'} recorded so far.`}
        </p>
      )}

      {onThisDay && onThisDay.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>On this day</h2>
          <p className="muted">Remembering those whose anniversary falls today.</p>
          {onThisDay.map((p) => (
            <Link
              key={p.id}
              to={`/deceased/${p.id}`}
              className="list-item"
            >
              {p.photoUrl ? (
                <img src={p.photoUrl} alt="" className="thumb" />
              ) : (
                <div className="thumb" />
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{p.fullName}</div>
                <div className="meta">{p.ward} · died {new Date(p.dateOfDeath).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </Link>
          ))}
        </>
      )}

      <h2 style={{ marginTop: '2rem' }}>Recently added</h2>
      {recent === null && (
        <>
          <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
        </>
      )}
      {recent && recent.length === 0 && (
        <p className="muted">No records yet. Be the first to register someone.</p>
      )}
      {recent && recent.map((p) => (
        <Link key={p.id} to={`/deceased/${p.id}`} className="list-item">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt="" className="thumb" />
          ) : (
            <div className="thumb" />
          )}
          <div>
            <div style={{ fontWeight: 600 }}>{p.fullName}</div>
            <div className="meta">{p.ward} · {p.dateOfDeath}</div>
          </div>
        </Link>
      ))}

      <p style={{ marginTop: '1rem' }}>
        <Link to="/deceased">See all in the register</Link>
      </p>
    </div>
  );
}