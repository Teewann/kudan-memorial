import { useEffect, useRef, useState } from 'react';

interface Props {
  url: string;
  title: string;
  text?: string;
}

export default function ShareMenu({ url, title, text }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const shareText = text || `In loving memory of ${title}.`;
  const fullUrl = url;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link:', fullUrl);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: fullUrl });
        setOpen(false);
      } catch {
        // user cancelled
      }
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`;
  const facebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
  const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`;
  const email = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;

  const hasNative = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button
        type="button"
        className="post-action"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Share
      </button>

      {open && (
        <div className="share-menu" role="menu">
          {hasNative && (
            <button className="share-item" onClick={nativeShare} role="menuitem">
              <span className="share-ico">&#8682;</span>
              Share via device
            </button>
          )}

          <a className="share-item" href={whatsapp} target="_blank" rel="noreferrer" role="menuitem">
            <span className="share-ico">&#128172;</span>
            WhatsApp
          </a>

          <a className="share-item" href={facebook} target="_blank" rel="noreferrer" role="menuitem">
            <span className="share-ico">f</span>
            Facebook
          </a>

          <a className="share-item" href={twitter} target="_blank" rel="noreferrer" role="menuitem">
            <span className="share-ico">X</span>
            X (Twitter)
          </a>

          <a className="share-item" href={email} role="menuitem">
            <span className="share-ico">&#9993;</span>
            Email
          </a>

          <button className="share-item" onClick={copyLink} role="menuitem">
            <span className="share-ico">&#128279;</span>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}