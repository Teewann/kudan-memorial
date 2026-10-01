import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Person { id: number; fullName: string; ward: string; dateOfDeath: string; photoUrl: string | null; }

export default function DeceasedList() {
  const [items, setItems] = useState<Person[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const limit = 20;

  const load = useCallback(() => {
    setItems(null);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
    if (q) params.set('q', q);
    api<{ items: Person[]; total: number }>(`/api/deceased?${params}`)
      .then((r) => { setItems(r.items); setTotal(r.total); })
      .catch(() => setItems([]));
  }, [page, sort, q]);

  useEffect(() => { load(); }, [load]);

  // Debounced search — never fire a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1>Deceased Register</h1>
      <div className="field">
        <input placeholder="Search by name…" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
      </div>
      <div className="field">
        <select value={sort} onChange={(e) => { setPage(1); setSort(e.target.value); }}>
          <option value="newest">Newest recorded first</option>
          <option value="oldest">Oldest recorded first</option>
          <option value="dod_newest">Date of death (newest)</option>
          <option value="dod_oldest">Date of death (oldest)</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      {items === null && (<><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></>)}
      {items?.length === 0 && <p>No records found.</p>}
      {items?.map((p) => (
        <Link key={p.id} to={`/deceased/${p.id}`} className="card deceased-card" style={{ textDecoration: 'none', color: 'inherit' }}>
          {p.photoUrl ? <img src={p.photoUrl} alt="" /> : <div className="photo-placeholder" />}
          <div>
            <strong>{p.fullName}</strong>
            <div className="badge">{p.ward}</div>
            <div style={{ color: 'var(--color-gray)' }}>{p.dateOfDeath}</div>
          </div>
        </Link>
      ))}

      <div className="pagination">
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="btn secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
