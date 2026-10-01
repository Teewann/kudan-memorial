import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function AddAnnouncement() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [burialTime, setBurialTime] = useState('');
  const [burialPlace, setBurialPlace] = useState('');
  const [note, setNote] = useState('');
  const [daysVisible, setDaysVisible] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await api('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          name,
          dateOfDeath,
          burialTime: burialTime || undefined,
          burialPlace: burialPlace || undefined,
          note: note || undefined,
          daysVisible: Number(daysVisible) || 30,
        }),
      });
      navigate('/announcements');
    } catch {
      setError('Could not post announcement. Are you logged in as a moderator?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Post announcement</h1>
      <p className="muted">Announcements are public and stay visible for the number of days you choose.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name of the deceased *</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={160} />
        </div>
        <div className="field">
          <label>Date of death *</label>
          <input required type="date" value={dateOfDeath} onChange={(e) => setDateOfDeath(e.target.value)} />
        </div>
        <div className="field">
          <label>Burial place</label>
          <input value={burialPlace} onChange={(e) => setBurialPlace(e.target.value)} maxLength={200} />
        </div>
        <div className="field">
          <label>Burial time</label>
          <input value={burialTime} onChange={(e) => setBurialTime(e.target.value)} maxLength={80} placeholder="e.g. 2:00 PM, Friday" />
        </div>
        <div className="field">
          <label>Note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="Any additional message for the community." />
        </div>
        <div className="field">
          <label>Stay visible for (days)</label>
          <input type="number" min={1} max={365} value={daysVisible} onChange={(e) => setDaysVisible(e.target.value)} />
        </div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Posting...' : 'Post announcement'}
        </button>
      </form>
    </div>
  );
}