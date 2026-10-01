import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface OnThisDay {
  id: number;
  fullName: string;
  ward: string;
  dateOfDeath: string;
  photoUrl: string | null;
}

interface MostViewed {
  id: number;
  fullName: string;
  ward: string;
  count: number;
}

interface Announcement {
  id: number;
  name: string;
  dateOfDeath: string;
  burialPlace: string | null;
  burialTime: string | null;
}

interface RecentCondolence {
  id: number;
  authorName: string;
  message: string;
  createdAt: string;
  deceasedId: number;
  deceasedName: string;
}

interface Summary {
  mostViewed: MostViewed[];
}

export default function RightRail() {
  const [onThisDay, setOnThisDay] = useState<OnThisDay[]>([]);
  const [mostViewed, setMostViewed] = useState<MostViewed[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [condolences, setCondolences] = useState<RecentCondolence[]>([]);

  useEffect(() => {
    api<{ items: OnThisDay[] }>('/api/deceased/on-this-day')
      .then((r) => setOnThisDay(r.items))
      .catch(() => {});

    api<Summary>('/api/analytics/summary')
      .then((r) => setMostViewed(r.mostViewed))
      .catch(() => {});

    api<{ items: Announcement[] }>('/api/announcements?page=1&limit=2')
      .then((r) => setAnnouncements(r.items))
      .catch(() => {});

    api<{ items: RecentCondolence[] }>('/api/condolences/recent?limit=5')
      .then((r) => setCondolences(r.items))
      .catch(() => {});
  }, []);

  return (
    <aside className="right-rail">
      {announcements.length > 0 && (
        <div className="rail-card">
          <div className="rail-title">Announcements</div>
          {announcements.map((a) => (
            <Link key={a.id} to={`/announcements/${a.id}`} className="rail-item">
              <div className="rail-item-title">{a.name}</div>
              {a.burialPlace && (
                <div className="rail-item-meta">
                  {a.burialPlace}
                  {a.burialTime ? ` \u00b7 ${a.burialTime}` : ''}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {onThisDay.length > 0 && (
        <div className="rail-card">
          <div className="rail-title">On this day</div>
          {onThisDay.slice(0, 4).map((p) => (
            <Link key={p.id} to={`/deceased/${p.id}`} className="rail-item">
              <div className="rail-item-title">{p.fullName}</div>
              <div className="rail-item-meta">{p.ward}</div>
            </Link>
          ))}
        </div>
      )}

      {mostViewed.length > 0 && (
        <div className="rail-card">
          <div className="rail-title">Most viewed</div>
          {mostViewed.slice(0, 5).map((p) => (
            <Link key={p.id} to={`/deceased/${p.id}`} className="rail-item">
              <div className="rail-item-title">{p.fullName}</div>
              <div className="rail-item-meta">
                {p.ward} \u00b7 {p.count} {p.count === 1 ? 'view' : 'views'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {condolences.length > 0 && (
        <div className="rail-card">
          <div className="rail-title">Recent condolences</div>
          {condolences.map((c) => (
            <Link key={c.id} to={`/deceased/${c.deceasedId}`} className="rail-item">
              <div className="rail-item-title">{c.authorName}</div>
              <div className="rail-item-meta">
                for {c.deceasedName}
              </div>
              <div className="rail-item-quote">
                {c.message.length > 90 ? c.message.slice(0, 90) + '...' : c.message}
              </div>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

