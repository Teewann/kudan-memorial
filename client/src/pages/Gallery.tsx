import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';

interface MemoryPhoto {
  id: number;
  fullName: string;
  hausaName: string | null;
  ward: string;
  dateOfDeath: string;
  photoUrl: string;
}

interface TownPhoto {
  id: number;
  title: string;
  description: string | null;
  photoUrl: string;
  category: string | null;
  createdAt: string;
}

type Tab = 'memory' | 'town';

const CATEGORIES = ['Mosque', 'Emirate', 'Market', 'People', 'History', 'Other'];

export default function Gallery() {
  const [tab, setTab] = useState<Tab>('memory');
  const [viewer, setViewer] = useState<string | null>(null);

  // Lock and unlock body scroll when the viewer opens and closes.
  useEffect(() => {
    if (viewer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [viewer]);

  // Escape key closes the viewer.
  useEffect(() => {
    if (!viewer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewer(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [viewer]);

  return (
    <div>
      <h1>Gallery</h1>
      <p className="muted">Photos of the people and the town of Kudan.</p>

      <div className="tabs">
        <button
          type="button"
          className={`tab${tab === 'memory' ? ' active' : ''}`}
          onClick={() => setTab('memory')}
        >
          In memory
        </button>
        <button
          type="button"
          className={`tab${tab === 'town' ? ' active' : ''}`}
          onClick={() => setTab('town')}
        >
          Kudan town
        </button>
      </div>

      {tab === 'memory' && <MemoryTab onOpen={setViewer} />}
      {tab === 'town' && <TownTab onOpen={setViewer} />}

            {viewer && (
        <div className="modal-scrim" onClick={() => setViewer(null)}>
          <img
            src={viewer}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              borderRadius: 6,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(1rem + env(safe-area-inset-top, 0px))',
              right: 16,
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(viewer);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
                a.download = `kudan-photo-${Date.now()}.${ext}`;
                document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                } catch {
                  window.open(viewer, '_blank');
                }
              }}
              aria-label="Download"
              title="Download this photo"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#14263f',
                fontSize: 20,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => setViewer(null)}
              aria-label="Close"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                color: '#14263f',
                fontSize: 24,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MemoryTab({ onOpen }: { onOpen: (src: string) => void }) {
  const [items, setItems] = useState<MemoryPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ items: MemoryPhoto[]; total: number }>(
        `/api/gallery/memory?page=${page}&limit=${pageSize}`
      );
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading) return <div className="skeleton" />;
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>No photos yet</h3>
        <p>When a memorial is approved with a photo, it appears here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-grid">
        {items.map((p) => (
          <Link key={p.id} to={`/deceased/${p.id}`} className="gallery-tile">
            <div className="gallery-tile-img">
              <img
                src={p.photoUrl}
                alt={p.fullName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpen(p.photoUrl);
                }}
              />
            </div>
            <div className="gallery-tile-caption">
              <div className="gallery-tile-name">{p.fullName}</div>
              <div className="gallery-tile-meta">{p.ward}</div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn secondary"
            disabled={page <= 1}
            onClick={() => setPage((n) => Math.max(1, n - 1))}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            className="btn secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

function TownTab({ onOpen }: { onOpen: (src: string) => void }) {
  const [items, setItems] = useState<TownPhoto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const pageSize = 30;

  const loggedIn = isLoggedIn();
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!loggedIn) return;
    api<{ user: { role: string } }>('/api/auth/me')
      .then((r) => setRole(r.user.role))
      .catch(() => {});
  }, [loggedIn]);

  const canUpload = loggedIn && (role === 'moderator' || role === 'admin');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ items: TownPhoto[]; total: number }>(
        `/api/gallery/town?page=${page}&limit=${pageSize}`
      );
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function remove(id: number) {
    if (!confirm('Delete this photo? This cannot be undone.')) return;
    try {
      await api(`/api/gallery/town/${id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Could not delete.');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      {canUpload && (
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn" onClick={() => setShowUpload((v) => !v)}>
            {showUpload ? 'Cancel' : 'Add a town photo'}
          </button>
        </div>
      )}

      {showUpload && canUpload && (
        <UploadForm onUploaded={() => { setShowUpload(false); load(); }} />
      )}

      {loading ? (
        <div className="skeleton" />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No town photos yet</h3>
          <p>
            {canUpload
              ? 'Add the first photo of the mosque, the market, or the people of Kudan.'
              : 'Historical photos of the town will appear here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="gallery-grid">
            {items.map((p) => (
              <div key={p.id} className="gallery-tile gallery-tile-town">
                <div className="gallery-tile-img">
                  <img
                    src={p.photoUrl}
                    alt={p.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    onClick={() => onOpen(p.photoUrl)}
                  />
                </div>
                <div className="gallery-tile-caption">
                  <div className="gallery-tile-name">{p.title}</div>
                  {p.category && <div className="gallery-tile-meta">{p.category}</div>}
                  {p.description && (
                    <div className="gallery-tile-desc">{p.description}</div>
                  )}
                  {canUpload && (
                    <button
                      className="comment-link"
                      onClick={() => remove(p.id)}
                      style={{ marginTop: 4 }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn secondary"
                disabled={page <= 1}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                className="btn secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!photo) {
      setError('Please choose a photo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('title', title);
      if (description) form.append('description', description);
      if (category) form.append('category', category);
      form.append('photo', photo);
      await api('/api/gallery/town', { method: 'POST', formData: form });
      onUploaded();
    } catch {
      setError('Could not upload. Are you logged in as a moderator?');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Add a town photo</h3>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Title <span className="req">*</span></label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            placeholder="e.g. Kudan Central Mosque"
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">No category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
          />
        </div>
        <div className="field">
          <label>Photo <span className="req">*</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && <div className="field error">{error}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Uploading...' : 'Upload photo'}
        </button>
      </form>
    </div>
  );
}