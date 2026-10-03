import { useEffect, useState, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Person {
  id: number;
  fullName: string;
  hausaName: string | null;
  sex: 'male' | 'female' | null;
  ward: string;
  dateOfBirth: string | null;
  dateOfDeath: string;
  bio: string | null;
  graveLocation: string | null;
  parentName: string | null;
  spouseName: string | null;
  familyId: number | null;
  submittedByName: string;
  submittedByPhone: string;
  status: 'pending' | 'verified' | 'hidden';
  photoUrl: string | null;
}

function normaliseDate(input: string): string {
  const s = input.trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, '0');
    const dd = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  return '';
}

export default function EditDeceased() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ person: Person }>(`/api/deceased/${id}`)
      .then((r) => setPerson(r.person))
      .catch(() => setError('Could not load this record.'))
      .finally(() => setLoading(false));
  }, [id]);

  function set<K extends keyof Person>(key: K, value: Person[K]) {
    setPerson((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!person || saving) return;
    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      fullName: person.fullName,
      hausaName: person.hausaName || null,
      sex: person.sex || null,
      ward: person.ward,
      dateOfBirth: person.dateOfBirth || null,
      dateOfDeath: person.dateOfDeath,
      bio: person.bio || null,
      graveLocation: person.graveLocation || null,
      parentName: person.parentName || null,
      spouseName: person.spouseName || null,
      familyId: person.familyId || null,
      submittedByName: person.submittedByName,
      submittedByPhone: person.submittedByPhone,
      status: person.status,
    };

    try {
      await api(`/api/deceased/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      navigate(`/deceased/${id}`);
    } catch {
      setError('Could not save changes. Are you logged in as a moderator?');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="skeleton" />;
  if (error && !person) return <p className="error">{error}</p>;
  if (!person) return null;

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="breadcrumb">
        <Link to="/deceased">Deceased Register</Link> /{' '}
        <Link to={`/deceased/${person.id}`}>{person.fullName}</Link> / Edit
      </div>

      <h1>Edit record</h1>
      <p className="muted">Only moderators see this page.</p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name <span className="req">*</span></label>
          <input required value={person.fullName} onChange={(e) => set('fullName', e.target.value)} />
        </div>

        <div className="field">
          <label>Hausa name</label>
          <input value={person.hausaName ?? ''} onChange={(e) => set('hausaName', e.target.value || null)} />
        </div>

        <div className="field">
          <label>Sex</label>
          <select value={person.sex ?? ''} onChange={(e) => set('sex', (e.target.value || null) as Person['sex'])}>
            <option value="">Not stated</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="field">
          <label>Ward / Area <span className="req">*</span></label>
          <input required value={person.ward} onChange={(e) => set('ward', e.target.value)} />
        </div>

        <div className="field">
          <label>Date of death <span className="req">*</span></label>
          <input
            required
            type="date"
            lang="en-GB"
            value={person.dateOfDeath}
            onChange={(e) => set('dateOfDeath', e.target.value)}
            onBlur={() => {
              const clean = normaliseDate(person.dateOfDeath);
              if (clean && clean !== person.dateOfDeath) set('dateOfDeath', clean);
            }}
          />
        </div>

        <div className="field">
          <label>Date of birth</label>
          <input
            type="date"
            lang="en-GB"
            value={person.dateOfBirth ?? ''}
            onChange={(e) => set('dateOfBirth', e.target.value || null)}
          />
        </div>

        <div className="field">
          <label>Parent</label>
          <input value={person.parentName ?? ''} onChange={(e) => set('parentName', e.target.value || null)} />
        </div>

        <div className="field">
          <label>Spouse</label>
          <input value={person.spouseName ?? ''} onChange={(e) => set('spouseName', e.target.value || null)} />
        </div>

        <div className="field">
          <label>Resting place</label>
          <input value={person.graveLocation ?? ''} onChange={(e) => set('graveLocation', e.target.value || null)} />
        </div>

        <div className="field">
          <label>Biography</label>
          <textarea value={person.bio ?? ''} onChange={(e) => set('bio', e.target.value || null)} />
        </div>

        <div className="field">
          <label>Status</label>
          <select value={person.status} onChange={(e) => set('status', e.target.value as Person['status'])}>
            <option value="pending">Pending</option>
            <option value="verified">Verified (visible publicly)</option>
            <option value="hidden">Hidden (not visible publicly)</option>
          </select>
        </div>

        <div className="field">
          <label>Submitted by name</label>
          <input value={person.submittedByName} onChange={(e) => set('submittedByName', e.target.value)} />
        </div>

        <div className="field">
          <label>Submitted by phone</label>
          <input value={person.submittedByPhone} onChange={(e) => set('submittedByPhone', e.target.value)} />
        </div>

        {error && <div className="field error">{error}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link to={`/deceased/${person.id}`} className="btn secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}