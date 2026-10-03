import { useEffect, useRef, useState } from 'react';

export interface PostMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export default function PostMenu({ items }: { items: PostMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="post-menu" ref={ref}>
      <button
        type="button"
        className="post-menu-btn"
        aria-label="More actions"
        onClick={() => setOpen((v) => !v)}
      >
        ⋯
      </button>
      {open && (
        <div className="post-menu-list" role="menu">
          {items.map((it, i) => (
            <button
              key={i}
              className={`post-menu-item${it.danger ? ' danger' : ''}`}
              onClick={() => { setOpen(false); it.onClick(); }}
              role="menuitem"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}