import { useEffect } from 'react';

interface Props {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImageViewer({ src, alt, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!src) return null;

  async function download() {
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (alt && alt.trim()) ? alt.trim().replace(/[^\w\-]+/g, '_') : 'kudan-photo';
      const ext = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      a.href = url;
      a.download = `${name}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt={alt ?? ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: 4,
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
          onClick={download}
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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}