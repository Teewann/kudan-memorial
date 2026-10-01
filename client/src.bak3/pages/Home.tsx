import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Reactions from '../components/Reactions';

interface FeedItem {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfBirth: string | null;
  dateOfDeath: string;
  bio: string | null;
  photoUrl: string | null;
  graveLocation: string | null;
  parentName: string | null;
  spouseName: string | null;
  condolenceCount: number;
}

interface Stats {
  people: number;
  families: number;
  condolences: number;
}

export default function Home() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>('/api/deceased/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<{ items: FeedItem[]; hasMore: boolean }>(`/api/deceased/feed?page=${page}&limit=10`)
      .then((r) => {
        setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
        setHasMore(r.hasMore);
      })
      .catch(() => setError('Could not load the feed.'))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <section className="hero">
        <h1>Kudan Memorial</h1>
        <p className="hero-lead">
          A lasting record of the people of Kudan, so the town never forgets.
        </p>
        {stats && (
          <div className="stat-bar">
            <div className="stat">
              <div className="stat-value">{stats.people}</div>
              <div className="stat-label">Remembered</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.families}</div>
              <div className="stat-label">Families</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.condolences}</div>
              <div className="stat-label">Condolences</div>
            </div>
          </div>
        )}
        <div className="hero-actions">
          <Link to="/deceased/new" className="btn">Register a Deceased</Link>
          <Link to="/families/new" className="btn secondary">Register a Family</Link>
        </div>
      </section>

      <h2 className="feed-heading">Remembered in Kudan</h2>

      {error && <p className="error">{error}</p>}

      {items.length === 0 && !loading && !error && (
        <p className="muted">No records yet. Be the first to register someone.</p>
      )}

      {items.map((p) => (
        <article key={p.id} className="feed-card">
          <div className="feed-photo">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" />
            ) : (
              <div className="feed-photo-placeholder" />
            )}
          </div>
          <div className="feed-body">
            <h3 style={{ marginBottom: 0 }}>{p.fullName}</h3>
            {p.hausaName && <div className="muted">{p.hausaName}</div>}
            <div className="feed-meta">
              <span className="badge">{p.ward}</span>
              <span className="muted">
                {new Date(p.dateOfDeath).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            </div>
            {p.bio && (
              <p className="feed-bio">{p.bio.length > 220 ? p.bio.slice(0, 220) + '...' : p.bio}</p>
            )}
                        <div className="feed-actions">
              <Link to={`/deceased/${p.id}`} className="btn secondary">View memorial</Link>
              <a
                className="btn secondary"
                href={`https://wa.me/?text=${encodeURIComponent(
                  `In loving memory of ${p.fullName}. ${window.location.origin}/deceased/${p.id}`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Share
              </a>
              <span className="muted feed-count">
                {p.condolenceCount} {p.condolenceCount === 1 ? 'condolence' : 'condolences'}
              </span>
            </div>
            <Reactions deceasedId={p.id} />
          </div>
        </article>
      ))}

      {loading && (
        <>
          <div className="skeleton" /><div className="skeleton" />
        </>
      )}

      {hasMore && !loading && (
        <div className="pagination">
          <button className="btn" onClick={() => setPage((p) => p + 1)}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}