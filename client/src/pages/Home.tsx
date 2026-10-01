import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import Reactions from '../components/Reactions';
import ImageViewer from '../components/ImageViewer';
import RightRail from '../components/RightRail';
import ShareMenu from '../components/ShareMenu';

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
  submittedByName: string | null;
  createdAt: string;
  condolenceCount: number;
}

interface Stats {
  people: number;
  families: number;
  condolences: number;
  reactions: number;
  thisMonth: number;
  today: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString();
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Home() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

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
        <div className="hero-inner">
          <div className="hero-mark">
            <img src="/mark.jpg" alt="" />
          </div>
          <h1>Kudan People Memories</h1>
          <p className="hero-lead">
            A lasting record of the people of Kudan, the town never forgets.
          </p>
          <div className="hero-actions">
            <Link to="/deceased/new" className="btn">Register a Deceased</Link>
            <Link to="/families/new" className="btn secondary">Register a Family</Link>
          </div>
        </div>
      </section>

      {stats && (
        <div className="stat-panel">
          <StatCard label="Remembered" value={stats.people} tone="navy" />
          <StatCard label="Families" value={stats.families} tone="teal" />
          <StatCard label="Condolences" value={stats.condolences} tone="navy" />
          <StatCard label="Reactions" value={stats.reactions} tone="teal" />
          <StatCard label="This month" value={stats.thisMonth} tone="navy" />
          <StatCard label="Today" value={stats.today} tone="teal" />
        </div>
      )}

      <div className="home-grid">
        <div className="feed-column">
          <h2 className="feed-heading">Remembered in Kudan</h2>

          {error && <p className="error">{error}</p>}

          {items.length === 0 && !loading && !error && (
            <div className="empty-state">
              <h3>No records yet</h3>
              <p>Be the first to register someone from Kudan.</p>
              <Link to="/deceased/new" className="btn">Register a Deceased</Link>
            </div>
          )}

          {items.map((p) => (
            <article key={p.id} className="post">
              <div className="post-author">
                <div className="post-avatar">
                  {p.photoUrl ? <img src={p.photoUrl} alt="" /> : <div className="post-avatar-ph" />}
                </div>
                <div className="post-author-text">
                  <Link to={`/deceased/${p.id}`} className="post-name">{p.fullName}</Link>
                  <div className="post-meta">
                    {p.hausaName ? `${p.hausaName} \u00b7 ` : ''}
                    {p.ward} \u00b7 died {longDate(p.dateOfDeath)}
                  </div>
                  <div className="post-time">
                    Recorded {timeAgo(p.createdAt)}
                    {p.submittedByName ? ` by ${p.submittedByName}` : ''}
                  </div>
                </div>
              </div>

              {p.bio && <div className="post-text">{p.bio}</div>}

              {p.photoUrl && (
                <div className="post-image" onClick={() => setViewerSrc(p.photoUrl)}>
                  <img src={p.photoUrl} alt={p.fullName} />
                </div>
              )}

              <div className="post-stats">
                {p.condolenceCount} {p.condolenceCount === 1 ? 'condolence' : 'condolences'}
              </div>

              <div className="post-actions">
                <Reactions deceasedId={p.id} />
                <Link to={`/deceased/${p.id}`} className="post-action">View memorial</Link>
                              <ShareMenu
                url={`${window.location.origin}/deceased/${p.id}`}
                title={p.fullName}
                text={`In loving memory of ${p.fullName}.`}
              />
              </div>
            </article>
          ))}

          {loading && (<><div className="skeleton" /><div className="skeleton" /></>)}

          {hasMore && !loading && (
            <div className="pagination">
              <button className="btn" onClick={() => setPage((p) => p + 1)}>Load more</button>
            </div>
          )}
        </div>

        <RightRail />
      </div>

      {viewerSrc && (
        <ImageViewer src={viewerSrc} alt="" onClose={() => setViewerSrc(null)} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'navy' | 'teal';
}) {
  return (
    <div className={`stat-panel-card ${tone}`}>
      <div className="stat-panel-value">{value}</div>
      <div className="stat-panel-label">{label}</div>
    </div>
  );
}