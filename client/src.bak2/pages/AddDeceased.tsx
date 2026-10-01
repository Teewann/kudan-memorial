import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, compressImage } from '../lib/api';

export default function AddDeceased() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', hausaName: '', ward: '', dateOfDeath: '', dateOfBirth: '',
    bio: '', graveLocation: '', parentName: '', spouseName: '',
    submittedByName: '', submittedByPhone: '',
  });
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(await compressImage(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return; // prevent double-submit
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo, 'photo.jpg');
      const res = await api<{ person: { id: number } }>('/api/deceased', { method: 'POST', formData: fd });
      navigate(`/deceased/${res.person.id}`);
    } catch {
      setError('Could not save this record. Please check the form and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Register a Deceased Person</h1>
      <p>New entries are reviewed by a moderator before appearing publicly.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name *</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div className="field">
          <label>Hausa / Arabic name</label>
          <input value={form.hausaName} onChange={(e) => setForm({ ...form, hausaName: e.target.value })} />
        </div>
        <div className="field">
          <label>Ward / area in Kudan *</label>
          <input required value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
        </div>
        <div className="field">
          <label>Date of death *</label>
          <input required type="date" value={form.dateOfDeath} onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })} />
        </div>
        <div className="field">
          <label>Date of birth (if known)</label>
          <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </div>
        <div className="field">
          <label>Photo</label>
          <input type="file" accept="image/*" onChange={onPhotoChange} />
        </div>
        <div className="field">
          <label>Parent's name</label>
          <input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
        </div>
        <div className="field">
          <label>Spouse's name</label>
          <input value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} />
        </div>
        <div className="field">
          <label>Resting place</label>
          <input value={form.graveLocation} onChange={(e) => setForm({ ...form, graveLocation: e.target.value })} />
        </div>
        <div className="field">
          <label>Short biography / remembrance</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div className="field">
          <label>Your name *</label>
          <input required value={form.submittedByName} onChange={(e) => setForm({ ...form, submittedByName: e.target.value })} />
        </div>
        <div className="field">
          <label>Your phone number *</label>
          <input required value={form.submittedByPhone} onChange={(e) => setForm({ ...form, submittedByPhone: e.target.value })} />
        </div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving, please wait' : 'Submit for review'}</button>
      </form>
    </div>
  );
}
