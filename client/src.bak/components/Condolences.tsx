import { useEffect, useState, FormEvent } from 'react';
import { api } from '../lib/api';

interface Condolence {
  id: number;
  authorName: string;
  message: string;
  createdAt: string;
}

export default function Condolences({ deceasedId }: { deceasedId: number }) {
  const [items, setItems] = useState<Condolence[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api<{ items: Condolence[]; total: number }>(
      `/api/condolences/deceased/${deceasedId}?page=${page}&limit=${limit}`
    )
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => setError('Could not load condolences.'))
      .finally(() => setLoading(false));
  }, [deceasedId, page, limit]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setSubmitError(null);
    setSubmitMessage(null);
    try {
      await api(`/api/condolences/deceased/${deceasedId}`, {
        method: 'POST',
        body: JSON.stringify({ authorName, message }),
      });
      setAuthorName('');
      setMessage('');
      setSubmitMessage(
        'Thank you. Your message has been received and will appear after a moderator reviews it.'
      );
    } catch {
      setSubmitError('Could not send your message. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="card">
      <h2>Condolences and prayers</h2>

      {loading && <div className="skeleton" />}
      {error && <p className="error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="muted">No messages yet. Be the first to leave one.</p>
      )}

      {items.map((c) => (
        <div key={c.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 600 }}>{c.authorName}</div>
          <div className="muted" style={{ fontSize: '0.85rem', marginBottom: 4 }}>
            {new Date(c.createdAt).toLocaleDateString()}
          </div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{c.message}</div>
        </div>
      ))}

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

      <h3 style={{ marginTop: '1.5rem' }}>Leave a condolence or prayer</h3>
      <p className="muted" style={{ fontSize: '0.9rem' }}>
        Your message will appear after a moderator reviews it. Please keep it respectful.
      </p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Your name *</label>
          <input required value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={120} />
        </div>
        <div className="field">
          <label>Your message *</label>
          <textarea required value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
        </div>
        {submitError && <div className="field error">{submitError}</div>}
        {submitMessage && <div className="field" style={{ color: 'var(--color-accent)' }}>{submitMessage}</div>}
        <button className="btn" type="submit" disabled={saving}>
          {saving ? 'Sending...' : 'Send condolence'}
        </button>
      </form>
    </div>
  );
}