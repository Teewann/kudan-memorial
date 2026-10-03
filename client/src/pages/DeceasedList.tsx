import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Person {
  id: number;
  fullName: string;
  ward: string;
  dateOfDeath: string;
  photoUrl: string | null;
}

export default function DeceasedList() {
  const [items, setItems] = useState<Person[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setItems(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
    });
    if (debouncedQ) params.set('q', debouncedQ);
    api<{ items: Person[]; total: number }>(`/api/deceased?${params.toString()}`)
      .then((r) => {
        setItems(r.items);
        setTotal(r.total);
      })
      .catch(() => setItems([]));
  }, [page, sort, debouncedQ]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1>Deceased Register</h1>

      <div className="field">
        <input
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="field">
        <select
          value={sort}
          onChange={(e) => { setPage(1); setSort(e.target.value); }}
        >
          <option value="newest">Newest recorded first</option>
          <option value="oldest">Oldest recorded first</option>
          <option value="dod_newest">Date of death (newest)</option>
          <option value="dod_oldest">Date of death (oldest)</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {items === null && (
        <>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </>
      )}

      {items !== null && items.length === 0 && (
        <div className="empty-state">
          <h3>No records found</h3>
          <p>Try a different name, or clear the search.</p>
          {debouncedQ && (
            <button className="btn secondary" onClick={() => setQ('')}>
              Clear search
            </button>
          )}
        </div>
      )}

      {items !== null && items.map((p) => (
        <Link
          key={p.id}
          to={`/deceased/${p.id}`}
          className="card deceased-card"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          {p.photoUrl ? (
            <img
              src={p.photoUrl}
              alt=""
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = 'none';
              }}
            />
          ) : (
            <div className="photo-placeholder" />
          )}
          <div>
            <strong>{p.fullName}</strong>
            <div className="badge">{p.ward}</div>
            <div style={{ color: 'var(--color-gray)' }}>{p.dateOfDeath}</div>
          </div>
        </Link>
      ))}

      {items !== null && items.length > 0 && (
        <div className="pagination">
          <button
            className="btn secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="btn secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}