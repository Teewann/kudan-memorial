import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
          Died {new Date(data.dateOfDeath).toLocaleDateString()}
        </div>

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

        {data.note && (
          <p style={{ marginTop: 16, whiteSpace: 'pre-wrap' }}>{data.note}</p>
        )}

        {loggedIn && (
          <button className="btn danger" style={{ marginTop: 12 }} disabled={busy} onClick={remove}>
            {busy ? 'Deleting...' : 'Delete announcement'}
          </button>
        )}
      </div>
    </div>
  );
}