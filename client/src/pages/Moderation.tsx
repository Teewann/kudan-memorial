import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';

interface PendingPerson {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfDeath: string;
  submittedByName: string;
  submittedByPhone: string;
  photoUrl: string | null;
  bio: string | null;
}

interface PendingCondolence {
  id: number;
  deceasedId: number;
  authorName: string;
  message: string;
  createdAt: string;
  status: string;
}

interface ReportedCondolence {
  reportId: number;
  condolenceId: number;
  reason: string | null;
  reportedAt: string;
  authorName: string;
  message: string;
  deceasedId: number;
  deceasedName: string;
  status: string;
}

interface AdminUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: 'member' | 'moderator' | 'admin';
  createdAt: string;
}

type Tab = 'deceased' | 'condolences' | 'reported' | 'hidden' | 'users';

export default function Moderation() {
  const [tab, setTab] = useState<Tab>('deceased');
  const [myRole, setMyRole] = useState<string>('');

  useEffect(() => {
    api<{ user: { role: string } }>('/api/auth/me')
      .then((r) => setMyRole(r.user.role))
      .catch(() => {});
  }, []);

  const canSeeUsers = myRole === 'admin' || myRole === 'moderator';

  return (
    <div>
      <h1>Moderation</h1>
      <div className="mod-tabs">
        <button className={tab === 'deceased' ? 'btn' : 'btn secondary'} onClick={() => setTab('deceased')}>
          Deceased
        </button>
        <button className={tab === 'condolences' ? 'btn' : 'btn secondary'} onClick={() => setTab('condolences')}>
          Pending condolences
        </button>
        <button className={tab === 'reported' ? 'btn' : 'btn secondary'} onClick={() => setTab('reported')}>
          Reported
        </button>
        <button className={tab === 'hidden' ? 'btn' : 'btn secondary'} onClick={() => setTab('hidden')}>
          Hidden
        </button>
        {canSeeUsers && (
          <button className={tab === 'users' ? 'btn' : 'btn secondary'} onClick={() => setTab('users')}>
            Users
          </button>
        )}
      </div>

      {tab === 'deceased' && <DeceasedTab />}
      {tab === 'condolences' && <CondolencesTab />}
      {tab === 'reported' && <ReportedTab />}
      {tab === 'hidden' && <HiddenTab />}
      {tab === 'users' && canSeeUsers && <UsersTab myRole={myRole} />}
    </div>
  );
}

function DeceasedTab() {
  const [items, setItems] = useState<PendingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PendingPerson | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: PendingPerson[] }>('/api/moderation/pending');
      setItems(res.items);
    } catch {
      setError('Could not load pending submissions.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'approve' | 'reject') {
    if (busy) return;
    setBusy(id);
    try {
      await api(`/api/moderation/${id}/${action}`, { method: 'PATCH' });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Action failed. Try again.');
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusy(id);
    try {
      await api(`/api/deceased/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Could not delete.');
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No pending submissions right now.</p>;

  return (
    <div>
      {items.map((p) => (
        <div key={p.id} className="card">
          <h2>{p.fullName}{p.hausaName ? ` (${p.hausaName})` : ''}</h2>
          {p.photoUrl && <img src={p.photoUrl} alt="" style={{ maxWidth: 160, borderRadius: 8, marginBottom: 8 }} />}
          <p><strong>Ward / Area:</strong> {p.ward}</p>
          <p><strong>Date of death:</strong> {new Date(p.dateOfDeath).toLocaleDateString('en-GB')}</p>
          <p><strong>Submitted by:</strong> {p.submittedByName} ({p.submittedByPhone})</p>
          {p.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{p.bio}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn approve" disabled={busy === p.id} onClick={() => act(p.id, 'approve')}>
              {busy === p.id ? 'Working...' : 'Approve'}
            </button>
            <button className="btn reject" disabled={busy === p.id} onClick={() => act(p.id, 'reject')}>
              Reject
            </button>
            <button className="btn danger" disabled={busy === p.id} onClick={() => setConfirmDelete(p)}>
              Delete
            </button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this submission?"
        message={confirmDelete ? `The record for ${confirmDelete.fullName} will be removed permanently. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function CondolencesTab() {
  const [items, setItems] = useState<PendingCondolence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PendingCondolence | null>(null);
  const [editing, setEditing] = useState<PendingCondolence | null>(null);
  const [editText, setEditText] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: PendingCondolence[] }>('/api/condolences/pending');
      setItems(res.items);
    } catch {
      setError('Could not load pending condolences.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id: number, action: 'approve' | 'reject') {
    if (busy) return;
    setBusy(id);
    try {
      await api(`/api/condolences/${id}/${action}`, { method: 'PATCH' });
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Action failed. Try again.');
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusy(id);
    try {
      await api(`/api/condolences/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Could not delete.');
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.id);
    try {
      await api(`/api/condolences/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ message: editText }),
      });
      setItems((prev) => prev.map((c) => c.id === editing.id ? { ...c, message: editText } : c));
      setEditing(null);
    } catch {
      alert('Could not save.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No pending condolences right now.</p>;

  return (
    <div>
      {items.map((c) => (
        <div key={c.id} className="card">
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            For <Link to={`/deceased/${c.deceasedId}`}>record #{c.deceasedId}</Link>, {new Date(c.createdAt).toLocaleDateString('en-GB')}
          </p>
          <p style={{ fontWeight: 600 }}>{c.authorName}</p>
          {editing?.id === c.id ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn approve" disabled={busy === c.id} onClick={saveEdit}>Save</button>
                <button className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <p style={{ whiteSpace: 'pre-wrap' }}>{c.message}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn approve" disabled={busy === c.id} onClick={() => act(c.id, 'approve')}>Approve</button>
            <button className="btn reject" disabled={busy === c.id} onClick={() => act(c.id, 'reject')}>Reject</button>
            <button className="btn secondary" onClick={() => { setEditing(c); setEditText(c.message); }}>Edit</button>
            <button className="btn danger" disabled={busy === c.id} onClick={() => setConfirmDelete(c)}>Delete</button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this condolence?"
        message="The comment will be removed permanently. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function ReportedTab() {
  const [items, setItems] = useState<ReportedCondolence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ReportedCondolence | null>(null);
  const [confirmHide, setConfirmHide] = useState<ReportedCondolence | null>(null);
  const [editing, setEditing] = useState<ReportedCondolence | null>(null);
  const [editText, setEditText] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: ReportedCondolence[] }>('/api/condolences/reported');
      setItems(res.items);
    } catch {
      setError('Could not load reported comments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function keep(item: ReportedCondolence) {
    setBusy(item.condolenceId);
    try {
      await api(`/api/condolences/${item.condolenceId}/reports`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.reportId !== item.reportId));
    } catch {
      alert('Could not dismiss.');
    } finally {
      setBusy(null);
    }
  }

  async function hide(item: ReportedCondolence) {
    setBusy(item.condolenceId);
    try {
      await api(`/api/condolences/${item.condolenceId}/reject`, { method: 'PATCH' });
      setItems((prev) => prev.filter((x) => x.reportId !== item.reportId));
    } catch {
      alert('Could not hide.');
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.condolenceId;
    setBusy(id);
    try {
      await api(`/api/condolences/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.condolenceId !== id));
    } catch {
      alert('Could not delete.');
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.condolenceId);
    try {
      await api(`/api/condolences/${editing.condolenceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ message: editText }),
      });
      setItems((prev) =>
        prev.map((c) => c.condolenceId === editing.condolenceId ? { ...c, message: editText } : c)
      );
      setEditing(null);
    } catch {
      alert('Could not save.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No reported comments right now.</p>;

  return (
    <div>
      {items.map((c) => (
        <div key={c.reportId} className="card">
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            Reported {new Date(c.reportedAt).toLocaleDateString('en-GB')} · reason: {c.reason || 'not stated'}
          </p>
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            On the memorial of <Link to={`/deceased/${c.deceasedId}`}>{c.deceasedName}</Link>
          </p>
          <p style={{ fontWeight: 600 }}>{c.authorName}</p>
          {editing?.reportId === c.reportId ? (
            <>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn approve" disabled={busy === c.condolenceId} onClick={saveEdit}>Save</button>
                <button className="btn secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <p style={{ whiteSpace: 'pre-wrap' }}>{c.message}</p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn approve" disabled={busy === c.condolenceId} onClick={() => keep(c)}>Keep</button>
            <button className="btn reject" disabled={busy === c.condolenceId} onClick={() => setConfirmHide(c)}>Hide</button>
            <button className="btn secondary" onClick={() => { setEditing(c); setEditText(c.message); }}>Edit</button>
            <button className="btn danger" disabled={busy === c.condolenceId} onClick={() => setConfirmDelete(c)}>Delete</button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmHide}
        title="Hide this comment?"
        message="It will no longer appear publicly. You can restore it from the Hidden tab."
        confirmLabel="Hide"
        danger
        onConfirm={async () => {
          if (!confirmHide) return;
          const item = confirmHide;
          setConfirmHide(null);
          await hide(item);
        }}
        onCancel={() => setConfirmHide(null)}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this comment?"
        message="The comment will be removed permanently. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function HiddenTab() {
  const [items, setItems] = useState<PendingCondolence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PendingCondolence | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: PendingCondolence[] }>('/api/condolences/hidden');
      setItems(res.items);
    } catch {
      setError('Could not load hidden comments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function restore(item: PendingCondolence) {
    setBusy(item.id);
    try {
      await api(`/api/condolences/${item.id}/restore`, { method: 'PATCH' });
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch {
      alert('Could not restore.');
    } finally {
      setBusy(null);
    }
  }

  async function doDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setBusy(id);
    try {
      await api(`/api/condolences/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Could not delete.');
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (items.length === 0) return <p className="muted">No hidden comments right now.</p>;

  return (
    <div>
      {items.map((c) => (
        <div key={c.id} className="card">
          <p className="muted" style={{ fontSize: '0.85rem' }}>
            For <Link to={`/deceased/${c.deceasedId}`}>record #{c.deceasedId}</Link>, {new Date(c.createdAt).toLocaleDateString('en-GB')}
          </p>
          <p style={{ fontWeight: 600 }}>{c.authorName}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{c.message}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btn approve" disabled={busy === c.id} onClick={() => restore(c)}>Restore</button>
            <button className="btn danger" disabled={busy === c.id} onClick={() => setConfirmDelete(c)}>Delete</button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this comment?"
        message="The comment will be removed permanently. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function UsersTab({ myRole }: { myRole: string }) {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (debouncedQ) params.set('q', debouncedQ);
      const res = await api<{ items: AdminUser[]; total: number }>(
        `/api/users?${params.toString()}`
      );
      setItems(res.items);
      setTotal(res.total);
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, debouncedQ]);

  async function changeRole(id: number, role: 'member' | 'moderator' | 'admin') {
    setBusy(id);
    try {
      await api(`/api/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setItems((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('cannot_demote_self')) {
        alert('You cannot change your own role.');
      } else if (msg.includes('cannot_promote_admin')) {
        alert('Only an admin can promote someone to admin.');
      } else {
        alert('Could not change the role.');
      }
    } finally {
      setBusy(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="filter-bar">
        <div className="filter-field" style={{ flex: 1, minWidth: 220 }}>
          <label>Search</label>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or phone"
          />
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="muted">No users match your search.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="ranked-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.phone}</td>
                    <td>{u.email ?? '—'}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={busy === u.id}
                        onChange={(e) => changeRole(u.id, e.target.value as AdminUser['role'])}
                        style={{ minHeight: 36, padding: '0 0.5rem' }}
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                                              </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="btn secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}