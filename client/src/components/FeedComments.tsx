import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
import PostMenu from './PostMenu';

interface Comment {
  id: number;
  authorName: string;
  message: string;
  createdAt: string;
  userId: number | null;
}

interface Me {
  id: number;
  name: string;
}

function timeAgo(iso: string): string {
  const s = iso.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(iso) ? iso : iso + 'Z';
  const diff = Date.now() - new Date(s).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  return new Date(s).toLocaleDateString('en-GB');
}

export default function FeedComments({ deceasedId }: { deceasedId: number }) {
  const loggedIn = isLoggedIn();
  const [me, setMe] = useState<Me | null>(null);

  const [items, setItems] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const [reported, setReported] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!loggedIn) {
      setMe(null);
      return;
    }
    api<{ user: Me }>('/api/auth/me')
      .then((r) => setMe(r.user))
      .catch(() => setMe(null));
  }, [loggedIn]);

  async function load() {
    setLoading(true);
    try {
      const r = await api<{ items: Comment[]; total: number }>(
        `/api/condolences/deceased/${deceasedId}?page=1&limit=20`
      );
      setItems(r.items);
      setTotal(r.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [deceasedId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSubmitError(null);
    setOkMessage(null);
    try {
      await api(`/api/condolences/deceased/${deceasedId}`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setMessage('');
      setOkMessage('Your condolence has been posted.');
      await load();
    } catch (err) {
      const text = err instanceof Error ? err.message : '';
      if (text.includes('message_blocked')) {
        setSubmitError('Your message was not posted. Please keep it respectful.');
      } else {
        setSubmitError('Could not post. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function report(id: number) {
    if (reported[id]) return;
    try {
      await api(`/api/condolences/${id}/report`, { method: 'POST', body: JSON.stringify({}) });
      setReported((prev) => ({ ...prev, [id]: true }));
    } catch {
      alert('Could not report. Try again later.');
    }
  }

  async function saveEdit(id: number) {
    try {
      await api(`/api/condolences/${id}/own`, {
        method: 'PATCH',
        body: JSON.stringify({ message: editText }),
      });
      setItems((prev) => prev.map((c) => c.id === id ? { ...c, message: editText } : c));
      setEditingId(null);
    } catch {
      alert('Could not save.');
    }
  }

  async function removeOwn(id: number) {
    if (!confirm('Delete your condolence? This cannot be undone.')) return;
    try {
      await api(`/api/condolences/${id}/own`, { method: 'DELETE' });
      await load();
    } catch {
      alert('Could not delete.');
    }
  }

  return (
    <>
      <button
        type="button"
        className={`comment-btn${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        💬 {total} {total === 1 ? 'condolence' : 'condolences'}
      </button>

      {open && (
        <div className="comments-body">
          <button
            type="button"
            className="comments-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>

          {loading ? (
            <div className="skeleton" style={{ height: 40 }} />
          ) : items.length === 0 ? (
            <p className="muted comments-empty">No condolences yet. Be the first.</p>
          ) : (
            items.map((c) => {
              const isOwner = !!me && c.userId === me.id;
              return (
                <div key={c.id} className="comment">
                  <div className="comment-avatar">
                    {c.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="comment-name">{c.authorName}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                      <PostMenu
                        items={[
                          ...(isOwner
                            ? [
                                { label: 'Edit', onClick: () => { setEditingId(c.id); setEditText(c.message); } },
                                { label: 'Delete', onClick: () => removeOwn(c.id), danger: true },
                              ]
                            : []),
                          {
                            label: reported[c.id] ? 'Reported' : 'Report',
                            onClick: () => report(c.id),
                          },
                        ]}
                      />
                    </div>

                    {editingId === c.id ? (
                      <>
                        <textarea
                          className="comment-input-text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={2000}
                        />
                        <div className="comment-actions">
                          <button className="comment-link" onClick={() => saveEdit(c.id)}>Save</button>
                          <button className="comment-link" onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <div className="comment-text">{c.message}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loggedIn && me ? (
            <form className="comment-form" onSubmit={onSubmit}>
              <div className="comment-as">
                Posting as <strong>{me.name}</strong>
              </div>
              <textarea
                className="comment-input-text"
                placeholder="Write a condolence or prayer..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                required
              />
              {submitError && <div className="field error">{submitError}</div>}
              {okMessage && <div className="comment-ok">{okMessage}</div>}
              <button className="btn condolence" type="submit" disabled={saving}>
                {saving ? 'Posting...' : 'Post condolence'}
              </button>
            </form>
          ) : (
            <div className="comment-login-prompt">
              <Link to="/login" className="btn condolence">Log in to leave a condolence</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}