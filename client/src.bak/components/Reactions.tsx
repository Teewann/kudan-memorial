import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Totals {
  remember: number;
  pray: number;
}
interface State {
  totals: Totals;
  mine: 'remember' | 'pray' | null;
}

// One stable random token per browser, stored in localStorage.
// That is how we know this visitor's reaction without a login.
function getVisitorToken(): string {
  const key = 'km_visitor';
  let t = localStorage.getItem(key);
  if (!t) {
    t = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, t);
  }
  return t;
}

export default function Reactions({ deceasedId }: { deceasedId: number }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = getVisitorToken();

  useEffect(() => {
    api<State>(`/api/reactions/deceased/${deceasedId}?visitorToken=${token}`)
      .then(setState)
      .catch(() => setError('Could not load reactions.'));
  }, [deceasedId, token]);

  async function react(kind: 'remember' | 'pray') {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<State>(`/api/reactions/deceased/${deceasedId}`, {
        method: 'POST',
        body: JSON.stringify({ kind, visitorToken: token }),
      });
      setState(res);
    } catch {
      setError('Could not save your reaction.');
    } finally {
      setBusy(false);
    }
  }

  if (!state && !error) return <div className="reactions">Loading reactions...</div>;
  if (error) return <div className="reactions error">{error}</div>;
  if (!state) return null;

  return (
    <div className="reactions">
      <button
        className={`reaction-btn${state.mine === 'remember' ? ' active' : ''}`}
        onClick={() => react('remember')}
        disabled={busy}
      >
        <span className="reaction-icon">🕯</span>
        <span>I remember</span>
        <span className="reaction-count">{state.totals.remember}</span>
      </button>
      <button
        className={`reaction-btn${state.mine === 'pray' ? ' active' : ''}`}
        onClick={() => react('pray')}
        disabled={busy}
      >
        <span className="reaction-icon">🤲</span>
        <span>Prayers</span>
        <span className="reaction-count">{state.totals.pray}</span>
      </button>
    </div>
  );
}