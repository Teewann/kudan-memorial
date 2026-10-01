import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Summary {
  totals: {
    people: number;
    pending: number;
    families: number;
    condolences: number;
    reactions: number;
    views: number;
  };
  byWard: Array<{ ward: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  mostViewed: Array<{ id: number; fullName: string; ward: string; count: number }>;
}

export default function Analytics() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api<Summary>('/api/analytics/summary')
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="error">Could not load statistics.</p>;
  if (!data) return <div className="skeleton" />;

  const { totals, byWard, byMonth, mostViewed } = data;
  const maxWard = Math.max(1, ...byWard.map((w) => w.count));
  const maxMonth = Math.max(1, ...byMonth.map((m) => m.count));

  return (
    <div>
      <h1>Statistics</h1>
      <p className="muted">
        An overview of everyone remembered in Kudan. Updated live.
      </p>

      <div className="stats-grid">
        <Stat label="People remembered" value={totals.people} />
        <Stat label="Families recorded" value={totals.families} />
        <Stat label="Condolences" value={totals.condolences} />
        <Stat label="Reactions" value={totals.reactions} />
        <Stat label="Page views" value={totals.views} />
        <Stat label="Awaiting review" value={totals.pending} />
      </div>

      <h2 style={{ marginTop: '2rem' }}>By ward</h2>
      {byWard.length === 0 ? (
        <p className="muted">No records yet.</p>
      ) : (
        <div className="bar-list">
          {byWard.map((w) => (
            <div key={w.ward} className="bar-row">
              <div className="bar-label">{w.ward}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(w.count / maxWard) * 100}%` }} />
              </div>
              <div className="bar-value">{w.count}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>By year of death</h2>
      {byMonth.length === 0 ? (
        <p className="muted">No records yet.</p>
      ) : (
        <div className="bar-list">
          {byMonth.map((m) => (
            <div key={m.month} className="bar-row">
              <div className="bar-label">{m.month}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(m.count / maxMonth) * 100}%` }} />
              </div>
              <div className="bar-value">{m.count}</div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '2rem' }}>Most viewed memorials</h2>
      {mostViewed.length === 0 ? (
        <p className="muted">No views recorded yet.</p>
      ) : (
        <div className="ledger">
          {mostViewed.map((p) => (
            <Link key={p.id} to={`/deceased/${p.id}`} className="ledger-row">
              <div className="name" style={{ flex: 1 }}>{p.fullName}</div>
              <div className="meta">{p.ward}</div>
              <div className="meta" style={{ marginLeft: '1rem' }}>{p.count} views</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}