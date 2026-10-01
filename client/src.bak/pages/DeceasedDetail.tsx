import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
import ImageViewer from '../components/ImageViewer';
import Reactions from '../components/Reactions';
import Condolences from '../components/Condolences';

interface Person {
  id: number; fullName: string; hausaName: string | null; ward: string;
  dateOfDeath: string; dateOfBirth: string | null; bio: string | null;
  photoUrl: string | null; graveLocation: string | null;
  parentName: string | null; spouseName: string | null;
}
interface Family { id: number; name: string; }

export default function DeceasedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{ person: Person; family: Family | null } | null>(null);
  const [error, setError] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canModerate = isLoggedIn();

  useEffect(() => {
    api<{ person: Person; family: Family | null }>(`/api/deceased/${id}`)
      .then(setData)
      .catch(() => setError(true));
  }, [id]);

  if (error) return <p>This record could not be found.</p>;
  if (!data) return <div className="skeleton" />;

  const { person, family } = data;
  const shareUrl = window.location.href;
  const waText = encodeURIComponent(`In loving memory of ${person.fullName}. ${shareUrl}`);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/deceased">Deceased Register</Link> / {person.fullName}
      </div>

      <div className="card">
        <div className="deceased-card">
          {person.photoUrl ? (
            <img
              src={person.photoUrl}
              alt=""
              onClick={() => setViewerOpen(true)}
              style={{ cursor: 'zoom-in' }}
            />
          ) : (
            <div className="photo-placeholder" />
          )}
          <div>
            <h1 style={{ marginBottom: 0 }}>{person.fullName}</h1>
            {person.hausaName && <div className="muted">{person.hausaName}</div>}
            <div className="badge" style={{ marginTop: 8 }}>{person.ward}</div>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <div className="detail-row">
            <span className="label">Date of death</span>
            <span>{person.dateOfDeath}</span>
          </div>
          {person.dateOfBirth && (
            <div className="detail-row">
              <span className="label">Date of birth</span>
              <span>{person.dateOfBirth}</span>
            </div>
          )}
          {person.parentName && (
            <div className="detail-row">
              <span className="label">Parent</span>
              <span>{person.parentName}</span>
            </div>
          )}
          {person.spouseName && (
            <div className="detail-row">
              <span className="label">Spouse</span>
              <span>{person.spouseName}</span>
            </div>
          )}
          {person.graveLocation && (
            <div className="detail-row">
              <span className="label">Resting place</span>
              <span>{person.graveLocation}</span>
            </div>
          )}
          {family && (
            <div className="detail-row">
              <span className="label">Family</span>
              <span><Link to={`/families/${family.id}`}>{family.name}</Link></span>
            </div>
          )}
        </div>

        {person.bio && (
          <p style={{ marginTop: '1.25rem', whiteSpace: 'pre-wrap' }}>{person.bio}</p>
        )}

        <a
          className="btn accent"
          style={{ marginTop: '0.5rem' }}
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
        >
          Share on WhatsApp
        </a>

        {canModerate && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <Link to={`/deceased/${person.id}/edit`} className="btn secondary">
              Edit record
            </Link>
            <button
              className="btn danger"
              disabled={deleting}
              onClick={async () => {
                if (!confirm(`Delete the record for ${person.fullName}? This cannot be undone.`)) return;
                setDeleting(true);
                try {
                  await api(`/api/deceased/${person.id}`, { method: 'DELETE' });
                  navigate('/deceased');
                } catch {
                  alert('Could not delete.');
                  setDeleting(false);
                }
              }}
            >
              {deleting ? 'Deleting...' : 'Delete record'}
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '0.75rem' }}>
        <Reactions deceasedId={person.id} />
      </div>

      <Condolences deceasedId={person.id} />

      {viewerOpen && person.photoUrl && (
        <ImageViewer
          src={person.photoUrl}
          alt={person.fullName}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}