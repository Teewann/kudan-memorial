import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';

interface Family {
  id: number; name: string; headName: string | null; ward: string;
  phone: string | null; history: string | null;
}
interface Member {
  id: number; name: string; relation: string | null; phone: string | null;
  photoUrl: string | null;
}
interface DeceasedRow {
  id: number; fullName: string; dateOfDeath: string; photoUrl: string | null;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function FamilyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<{
    family: Family; members: Member[]; deceasedMembers: DeceasedRow[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const loggedIn = isLoggedIn();

  async function load() {
    try {
      const res = await api<{ family: Family; members: Member[]; deceasedMembers: DeceasedRow[] }>(
        `/api/families/${id}`
      );
      setData(res);
    } catch {
      setError(true);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function removeMember(memberId: number) {
    if (!confirm('Remove this member from the family?')) return;
    try {
      await api(`/api/families/${id}/members/${memberId}`, { method: 'DELETE' });
      setData((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev);
    } catch {
      alert('Could not remove member.');
    }
  }

  if (error) return <p>This family could not be found.</p>;
  if (!data) return <div className="skeleton" />;

  const { family, members, deceasedMembers } = data;

  return (
    <div>
      <button type="button" className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="breadcrumb">
        <Link to="/families">Families</Link> / {family.name}
      </div>

      <div className="card">
        <h1 style={{ marginBottom: 0 }}>{family.name}</h1>
        <div className="badge" style={{ marginTop: 8 }}>{family.ward}</div>
        {family.headName && <p style={{ marginTop: 12 }}><strong>Head of family:</strong> {family.headName}</p>}
        {family.phone && <p><strong>Phone:</strong> {family.phone}</p>}
        {family.history && <p style={{ whiteSpace: 'pre-wrap' }}>{family.history}</p>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Living members</h2>
          {loggedIn && (
            <button
              className="btn secondary"
              style={{ marginLeft: 'auto', minHeight: 40 }}
              onClick={() => setShowAdd((v) => !v)}
            >
              {showAdd ? 'Cancel' : 'Add member'}
            </button>
          )}
        </div>

        {showAdd && loggedIn && (
          <AddMemberForm
            familyId={family.id}
            onAdded={(m) => {
              setData((prev) => prev ? { ...prev, members: [...prev.members, m] } : prev);
              setShowAdd(false);
            }}
          />
        )}

        {members.length === 0 ? (
          <p className="muted">No members added yet.</p>
        ) : (
          members.map((m) => (
            <div key={m.id} className="detail-row">
              <span style={{ fontWeight: 600 }}>{m.name}</span>
              {m.relation && <span className="muted">({m.relation})</span>}
              {m.phone && <span className="muted">{m.phone}</span>}
              {loggedIn && (
                <button
                  className="btn secondary"
                  style={{ marginLeft: 'auto', minHeight: 36, padding: '0 0.75rem' }}
                  onClick={() => removeMember(m.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>Deceased members</h2>
        {deceasedMembers.length === 0 ? (
          <p className="muted">None recorded yet.</p>
        ) : (
          deceasedMembers.map((d) => (
            <Link
              key={d.id}
              to={`/deceased/${d.id}`}
              className="detail-row"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              <span style={{ fontWeight: 600 }}>{d.fullName}</span>
              <span className="muted" style={{ marginLeft: 'auto' }}>
                died {longDate(d.dateOfDeath)}
              </span>
            </Link>
          ))
        )}
        <p className="muted" style={{ marginTop: 12, fontSize: '0.9rem' }}>
          To add a deceased member, register them from the Deceased Register page
          and choose this family in the form.
        </p>
      </div>
    </div>
  );
}

function AddMemberForm({
  familyId,
  onAdded,
}: {
  familyId: number;
  onAdded: (m: Member) => void;
}) {
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ member: Member }>(`/api/families/${familyId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          relation: relation || undefined,
          phone: phone || undefined,
        }),
      });
      onAdded(res.member);
    } catch {
      setError('Could not add member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 12, marginBottom: 12 }}>
      <div className="field">
        <label>Full name <span className="req">*</span></label>
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label>Relation (e.g. son, daughter, wife)</label>
        <input value={relation} onChange={(e) => setRelation(e.target.value)} />
      </div>
      <div className="field">
        <label>Phone (optional)</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <div className="field error">{error}</div>}
      <button className="btn" type="submit" disabled={saving}>
        {saving ? 'Adding...' : 'Add member'}
      </button>
    </form>
  );
}