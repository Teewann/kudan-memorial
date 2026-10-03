import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, compressImage } from '../lib/api';

interface DuplicateMatch {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfDeath: string;
  similarity: number;
}

export default function AddDeceased() {
  const [fullName, setFullName] = useState('');
  const [hausaName, setHausaName] = useState('');
  const [sex, setSex] = useState<'' | 'male' | 'female'>('');
  const [ward, setWard] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [bio, setBio] = useState('');
  const [graveLocation, setGraveLocation] = useState('');
  const [parentName, setParentName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [submittedByName, setSubmittedByName] = useState('');
  const [submittedByPhone, setSubmittedByPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

    useEffect(() => {
    const cleanName = fullName.trim();
    const cleanDate = normaliseDate(dateOfDeath);
    if (cleanName.length < 3 || !cleanDate) {
      setMatches([]);
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams({
        fullName: cleanName,
        dateOfDeath: cleanDate,
      });
      api<{ matches: DuplicateMatch[] }>(`/api/deceased/check-duplicate?${params.toString()}`)
        .then((r) => setMatches(r.matches))
        .catch(() => setMatches([]));
    }, 400);
    return () => clearTimeout(t);
  }, [fullName, dateOfDeath]);

            <input
            required
            type="date"
            value={dateOfDeath}
            onChange={(e) => setDateOfDeath(e.target.value)}
            onBlur={() => {
              const clean = normaliseDate(dateOfDeath);
              if (clean && clean !== dateOfDeath) setDateOfDeath(clean);
            }}
          />
// Accepts YYYY-MM-DD from the browser or MM/DD/YYYY typed by the user,
// returns YYYY-MM-DD or empty string.
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('fullName', fullName);
      if (hausaName) form.append('hausaName', hausaName);
      if (sex) form.append('sex', sex);
      form.append('ward', ward);
      if (dateOfBirth) form.append('dateOfBirth', dateOfBirth);
      form.append('dateOfDeath', dateOfDeath);
      if (bio) form.append('bio', bio);
      if (graveLocation) form.append('graveLocation', graveLocation);
      if (parentName) form.append('parentName', parentName);
      if (spouseName) form.append('spouseName', spouseName);
      form.append('submittedByName', submittedByName);
      form.append('submittedByPhone', submittedByPhone);

      if (photo) {
        const compressed = await compressImage(photo);
        form.append('photo', new File([compressed], photo.name, { type: 'image/jpeg' }));
      }

      await api('/api/deceased', { method: 'POST', formData: form });
      setDone(true);
    } catch {
      setError('Could not submit. Please check the fields and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="empty-state">
        <h3>Thank you</h3>
        <p>
          Your submission has been received. A moderator will review it before it
          appears publicly.
        </p>
        <Link to="/deceased" className="btn">Back to the register</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Add a Deceased</h1>
      <p className="muted">
        No account is needed. Your submission will be reviewed before it appears publicly.
      </p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name <span className="req">*</span></label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={160}
          />
        </div>

        <div className="field">
          <label>Hausa name</label>
          <input value={hausaName} onChange={(e) => setHausaName(e.target.value)} maxLength={160} />
        </div>

        <div className="field">
          <label>Sex</label>
          <select value={sex} onChange={(e) => setSex(e.target.value as typeof sex)}>
            <option value="">Not stated</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div className="field">
          <label>Ward / Area <span className="req">*</span></label>
          <input required value={ward} onChange={(e) => setWard(e.target.value)} maxLength={120} />
        </div>

                <div className="field">
          <label>Date of death <span className="req">*</span></label>
          <input
            required
            type="date"
            value={dateOfDeath}
            onChange={(e) => setDateOfDeath(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Date of birth</label>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </div>

        <div className="field">
          <label>Parent</label>
          <input value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={160} />
        </div>

        <div className="field">
          <label>Spouse</label>
          <input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} maxLength={160} />
        </div>

        <div className="field">
          <label>Resting place</label>
          <input
            value={graveLocation}
            onChange={(e) => setGraveLocation(e.target.value)}
            maxLength={400}
          />
        </div>

        <div className="field">
          <label>Biography</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={4000} />
        </div>

        <div className="field">
          <label>Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
          <div className="hint">A clear photo helps people recognise the person.</div>
        </div>

        <div className="field">
          <label>Your name <span className="req">*</span></label>
          <input
            required
            value={submittedByName}
            onChange={(e) => setSubmittedByName(e.target.value)}
            maxLength={160}
          />
        </div>

        <div className="field">
          <label>Your phone <span className="req">*</span></label>
          <input
            required
            value={submittedByPhone}
            onChange={(e) => setSubmittedByPhone(e.target.value)}
            maxLength={40}
          />
        </div>

        {matches.length > 0 && (
          <div className="duplicate-warning">
            <div className="duplicate-warning-title">
              This person may already be recorded. Check the register first.
            </div>
            <ul className="duplicate-warning-list">
              {matches.map((m) => (
                <li key={m.id}>
                  <a href={`/deceased/${m.id}`} target="_blank" rel="noreferrer">
                    {m.fullName}
                    {m.hausaName ? ` (${m.hausaName})` : ''}
                  </a>
                  {' · '}
                  died {m.dateOfDeath} · {m.ward}
                </li>
              ))}
            </ul>
            <div className="duplicate-warning-note">
              If it is not the same person, you can still submit. A moderator will review it.
            </div>
          </div>
        )}

        {error && <div className="field error">{error}</div>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? 'Submitting...' : 'Submit for review'}
          </button>
          <Link to="/deceased" className="btn secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}