import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import Reactions from '../components/Reactions';
import ImageViewer from '../components/ImageViewer';
import RightRail from '../components/RightRail';
import ShareMenu from '../components/ShareMenu';
import Tabs from '../components/Tabs';
import Analytics from './Analytics';
import FeedComments from '../components/FeedComments';
import PostMenu from '../components/PostMenu';

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

function ageAtDeath(birth: string | null, death: string): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  const d = new Date(death);
  if (isNaN(b.getTime()) || isNaN(d.getTime())) return null;

  let years = d.getFullYear() - b.getFullYear();
  let months = d.getMonth() - b.getMonth();
  let days = d.getDate() - b.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(d.getFullYear(), d.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (parts.length === 0 || days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  return parts.join(' ');
}

function timeAgo(iso: string): string {
  const s = iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  const diff = Date.now() - new Date(s).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(s).toLocaleDateString('en-GB');
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function Home() {
  const { pathname } = useLocation();
  const isStats = pathname === '/stats';

  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    api<Stats>('/api/deceased/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (isStats) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (debouncedQ) params.set('q', debouncedQ);

    api<{ items: FeedItem[]; hasMore: boolean }>(`/api/deceased/feed?${params.toString()}`)
      .then((r) => {
        setItems((prev) => (page === 1 ? r.items : [...prev, ...r.items]));
        setHasMore(r.hasMore);
      })
      .catch(() => setError('Could not load the feed.'))
      .finally(() => setLoading(false));
  }, [page, isStats, debouncedQ]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

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

      <Tabs
        active={pathname}
        tabs={[
          { label: 'Feed', to: '/', end: true },
          { label: 'Statistics', to: '/stats' },
        ]}
      />

      {!isStats && stats && (
        <div className="stat-panel">
          <StatCard label="Remembered" value={stats.people} tone="navy" />
          <StatCard label="Families" value={stats.families} tone="teal" />
          <StatCard label="Condolences" value={stats.condolences} tone="navy" />
          <StatCard label="Reactions" value={stats.reactions} tone="teal" />
          <StatCard label="This month" value={stats.thisMonth} tone="navy" />
          <StatCard label="Today" value={stats.today} tone="teal" />
        </div>
      )}

      {!isStats && (
        <div className="home-grid">
          <div className="feed-column">
            <h2 className="feed-heading">Remembered in Kudan</h2>

            <div className="feed-search">
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, Hausa name, or ward"
                aria-label="Search the feed"
              />
            </div>

            {error && <p className="error">{error}</p>}

            {items.length === 0 && !loading && !error && debouncedQ && (
              <div className="empty-state">
                <h3>No results</h3>
                <p>No records match "{debouncedQ}". Try a different name.</p>
                <button className="btn secondary" onClick={() => setQ('')}>
                  Clear search
                </button>
              </div>
            )}

            {items.length === 0 && !loading && !error && !debouncedQ && (
              <div className="empty-state">
                <h3>No records yet</h3>
                <p>Be the first to register someone from Kudan.</p>
                <Link to="/deceased/new" className="btn">Register a Deceased</Link>
              </div>
            )}

            {items.map((p) => {
              const age = ageAtDeath(p.dateOfBirth, p.dateOfDeath);
              return (
                <article key={p.id} className="post">
                  <div className="post-author">
                    <div className="post-avatar">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt=""
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="post-avatar-ph" />
                      )}
                    </div>
                    <div className="post-author-text">
                      <Link to={`/deceased/${p.id}`} className="post-name">{p.fullName}</Link>
                      <div className="post-meta">
                        {p.hausaName ? `${p.hausaName} · ` : ''}
                        {p.ward} · died {longDate(p.dateOfDeath)}
                        {age ? ` · lived ${age}` : ''}
                      </div>
                      <div className="post-time">
                        Recorded {timeAgo(p.createdAt)}
                        {p.submittedByName ? ` by ${p.submittedByName}` : ''}
                      </div>
                    </div>
                    <PostMenu
                      items={[
                        {
                          label: 'Copy link',
                          onClick: () => navigator.clipboard.writeText(`${window.location.origin}/deceased/${p.id}`),
                        },
                        {
                          label: 'Open memorial',
                          onClick: () => { window.location.href = `/deceased/${p.id}`; },
                        },
                      ]}
                    />
                  </div>

                  {p.bio && <div className="post-text">{p.bio}</div>}

                  {p.photoUrl && (
                    <div className="post-image" onClick={() => setViewerSrc(p.photoUrl)}>
                      <img
                        src={p.photoUrl}
                        alt={p.fullName}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="post-actions">
                    <Reactions deceasedId={p.id} />
                    <FeedComments deceasedId={p.id} />
                    <ShareMenu
                      url={`${window.location.origin}/deceased/${p.id}`}
                      title={p.fullName}
                      text={`In loving memory of ${p.fullName}.`}
                    />
                    <Link to={`/deceased/${p.id}`} className="post-action">View memorial</Link>
                  </div>
                </article>
              );
            })}

            {loading && (<><div className="skeleton" /><div className="skeleton" /></>)}

            {hasMore && !loading && (
              <div className="pagination">
                <button className="btn" onClick={() => setPage((p) => p + 1)}>Load more</button>
              </div>
            )}
          </div>

          <RightRail />
        </div>
      )}

      {isStats && <Analytics />}

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