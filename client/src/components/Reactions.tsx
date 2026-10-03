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

// One stable token per browser, computed once at module load.
const VISITOR_TOKEN = (() => {
  const key = 'km_visitor';
  let t = localStorage.getItem(key);
  if (!t) {
    t = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, t);
  }
  return t;
})();

export default function Reactions({ deceasedId }: { deceasedId: number }) {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<State>(`/api/reactions/deceased/${deceasedId}?visitorToken=${VISITOR_TOKEN}`)
      .then(setState)
      .catch(() => setError('Could not load reactions.'));
  }, [deceasedId]);

  async function react(kind: 'remember' | 'pray') {
    if (busy) return;
    setBusy(true);
    setError(null);

    // Optimistic update: flip the UI right away, then confirm with the server.
    setState((prev) => {
      if (!prev) return prev;
      const totals = { ...prev.totals };
      const was = prev.mine;

      // Undo the old reaction in the local count if there was one.
      if (was === 'remember') totals.remember = Math.max(0, totals.remember - 1);
      if (was === 'pray') totals.pray = Math.max(0, totals.pray - 1);

      // If clicking the same one, this becomes a removal.
      if (was === kind) {
        return { totals, mine: null };
      }

      // Otherwise add to the new kind.
      if (kind === 'remember') totals.remember += 1;
      if (kind === 'pray') totals.pray += 1;

      return { totals, mine: kind };
    });

    try {
      const res = await api<State>(`/api/reactions/deceased/${deceasedId}`, {
        method: 'POST',
        body: JSON.stringify({ kind, visitorToken: VISITOR_TOKEN }),
      });
      setState(res);
    } catch {
      setError('Could not save your reaction.');
      // Re-fetch to get the truth back.
      api<State>(`/api/reactions/deceased/${deceasedId}?visitorToken=${VISITOR_TOKEN}`)
        .then(setState)
        .catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  if (error && !state) {
    return <span className="error" style={{ alignSelf: 'center' }}>{error}</span>;
  }
  if (!state) {
    return (
      <button type="button" className="reaction-btn" disabled>
        <span className="reaction-icon">🕯</span> Loading…
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className={`reaction-btn${state.mine === 'remember' ? ' active' : ''}`}
        onClick={() => react('remember')}
        disabled={busy}
      >
        <span className="reaction-icon">🕯</span>
        <span>I remember</span>
        <span className="reaction-count">{state.totals.remember}</span>
      </button>
      <button
        type="button"
        className={`reaction-btn${state.mine === 'pray' ? ' active' : ''}`}
        onClick={() => react('pray')}
        disabled={busy}
      >
        <span className="reaction-icon">🤲</span>
        <span>Prayers</span>
        <span className="reaction-count">{state.totals.pray}</span>
      </button>
    </>
  );
}