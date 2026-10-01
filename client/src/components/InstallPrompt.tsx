import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Already installed? Do not show.
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Dismissed before? Do not show again.
    if (localStorage.getItem('km_install_dismissed') === '1') return;

    // Detect iOS Safari, where beforeinstallprompt is not supported.
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
    setIsIos(ios);

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem('km_install_dismissed', '1');
    setHidden(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') setHidden(true);
    setDeferred(null);
  }

  if (hidden) return null;
  if (!deferred && !isIos) return null;

  return (
    <div className="install-banner">
      <div className="install-text">
        <strong>Install Kudan Memorial</strong>
        <span className="muted">
          {isIos
            ? 'Tap Share, then Add to Home Screen to install.'
            : 'Add it to your home screen for quick access.'}
        </span>
      </div>
      {!isIos && <button className="btn" onClick={install}>Install</button>}
      <button className="install-close" onClick={dismiss} aria-label="Close">×</button>
    </div>
  );
}