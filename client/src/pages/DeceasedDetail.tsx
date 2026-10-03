import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
import ImageViewer from '../components/ImageViewer';
import Reactions from '../components/Reactions';
import Condolences from '../components/Condolences';
import ShareMenu from '../components/ShareMenu';

interface Person {
  id: number; fullName: string; hausaName: string | null; ward: string;
  dateOfDeath: string; dateOfBirth: string | null; bio: string | null;
  photoUrl: string | null; graveLocation: string | null;
  parentName: string | null; spouseName: string | null;
}
interface Family { id: number; name: string; }

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

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

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
      .then((r) => {
        setData(r);
        api(`/api/analytics/view/${id}`, { method: 'POST' }).catch(() => {});
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) return <p>This record could not be found.</p>;
  if (!data) return <div className="skeleton" />;

  const { person, family } = data;
  const age = ageAtDeath(person.dateOfBirth, person.dateOfDeath);

  async function onDelete() {
    if (!confirm(`Delete the record for ${person.fullName}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/api/deceased/${person.id}`, { method: 'DELETE' });
      navigate('/deceased');
    } catch {
      alert('Could not delete.');
      setDeleting(false);
    }
  }

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

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

        <div className="detail-block">
          <div className="detail-row">
            <span className="label">Date of death</span>
            <span>{longDate(person.dateOfDeath)}</span>
          </div>
          {person.dateOfBirth && (
            <div className="detail-row">
              <span className="label">Date of birth</span>
              <span>{longDate(person.dateOfBirth)}</span>
            </div>
          )}
          {age && (
            <div className="detail-row">
              <span className="label">Lived for</span>
              <span>{age}</span>
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

        <div className="action-bar">
          <ShareMenu
            url={window.location.href}
            title={person.fullName}
            text={`In loving memory of ${person.fullName}.`}
          />
          {canModerate && (
            <>
              <Link to={`/deceased/${person.id}/edit`} className="btn secondary">
                Edit record
              </Link>
              <button className="btn danger" disabled={deleting} onClick={onDelete}>
                {deleting ? 'Deleting...' : 'Delete record'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
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