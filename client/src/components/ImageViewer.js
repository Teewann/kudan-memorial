import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
export default function ImageViewer({ src, alt, onClose }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape')
                onClose();
        }
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);
    if (!src)
        return null;
    return (_jsxs("div", { onClick: onClose, style: {
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            cursor: 'zoom-out',
        }, children: [_jsx("img", { src: src, alt: alt ?? '', onClick: (e) => e.stopPropagation(), style: {
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 4,
                } }), _jsx("button", { onClick: onClose, "aria-label": "Close", style: {
                    position: 'absolute',
                    top: 'calc(1rem + env(safe-area-inset-top, 0px))',
                    right: 16,
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#14263f',
                    fontSize: 24,
                    fontWeight: 700,
                    cursor: 'pointer',
                }, children: "\u00D7" })] }));
}
