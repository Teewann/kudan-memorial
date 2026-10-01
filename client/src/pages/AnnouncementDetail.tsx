import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
import ShareMenu from '../components/ShareMenu';

interface Announcement {
  id: number;
  name: string;
  dateOfDeath: string;
  note: string | null;
  burialTime: string | null;
  burialPlace: string | null;
  createdAt: string;
  expiresAt: string;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Announcement | null>(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const loggedIn = isLoggedIn();

  useEffect(() => {
    api<{ announcement: Announcement }>(`/api/announcements/${id}`)
      .then((res) => setData(res.announcement))
      .catch(() => setError(true));
  }, [id]);

  async function remove() {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api(`/api/announcements/${id}`, { method: 'DELETE' });
      navigate('/announcements');
    } catch {
      alert('Could not delete.');
      setBusy(false);
    }
  }

  if (error) return <p>This announcement could not be found.</p>;
  if (!data) return <div className="skeleton" />;

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/announcements">Announcements</Link> / {data.name}
      </div>

      <div className="card">
        <h1 style={{ marginBottom: 4 }}>{data.name}</h1>
        <div className="muted" style={{ marginBottom: 16 }}>
          Died {longDate(data.dateOfDeath)}
        </div>

        <div className="detail-block">
          {data.burialPlace && (
            <div className="detail-row">
              <span className="label">Burial place</span>
              <span>{data.burialPlace}</span>
            </div>
          )}
          {data.burialTime && (
            <div className="detail-row">
              <span className="label">Burial time</span>
              <span>{data.burialTime}</span>
            </div>
          )}
        </div>

        {data.note && (
          <p style={{ marginTop: '1.25rem', whiteSpace: 'pre-wrap' }}>{data.note}</p>
        )}

        <div className="action-bar">
          <ShareMenu
            url={window.location.href}
            title={data.name}
            text={`Announcement for ${data.name}.`}
          />
          {loggedIn && (
            <button className="btn danger" disabled={busy} onClick={remove}>
              {busy ? 'Deleting...' : 'Delete announcement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}