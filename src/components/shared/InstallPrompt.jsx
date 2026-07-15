import React, { useState, useEffect, useCallback } from 'react';
import { X, Share, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'drg_install_dismissed';
const INSTALLED_KEY = 'drg_install_installed';

/**
 * Detects iOS (iPhone/iPad) Safari — the only browser on iOS that supports
 * "Add to Home Screen". Returns true for iPhone and iPad (including iPadOS 13+
 * which reports as Macintosh).
 */
function detectIOS() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS13 = /Macintosh/.test(ua) && 'ontouchend' in document;
  return isIOS || isIPadOS13;
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true
  );
}

/**
 * "Save App to Home Screen" prompt.
 *
 * - Android: Listens for beforeinstallprompt, shows a floating Install button,
 *   triggers the native prompt on click.
 * - iOS: Shows a dismissible tooltip instructing the user to tap Share → Add to Home Screen.
 *
 * Respects localStorage so dismissed/installed states persist.
 * Hidden on desktop, in standalone mode, and after dismissal/install.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show on desktop, in standalone mode, or if already dismissed/installed
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    if (localStorage.getItem(INSTALLED_KEY) === '1') return;

    const ios = detectIOS();
    setIsIOS(ios);

    // --- Android / Chrome: intercept beforeinstallprompt ---
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // --- Detect successful install ---
    const handleAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // --- iOS: show tooltip if not standalone ---
    if (ios && !isStandalone()) {
      // Small delay so it doesn't flash on initial page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1');
      } else {
        localStorage.setItem(DISMISS_KEY, '1');
      }
      setDeferredPrompt(null);
      setVisible(false);
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  if (!visible) return null;

  // --- iOS tooltip ---
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative bg-card border border-border shadow-2xl rounded-2xl p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">
                Add to Home Screen
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                To install this app on your iPhone, tap the{' '}
                <Share className="inline-flex w-3.5 h-3.5 text-primary align-text-bottom" />{' '}
                Share button and select{' '}
                <span className="font-medium text-foreground">"Add to Home Screen"</span>.
              </p>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-b border-r border-border rotate-45" />
        </div>
      </div>
    );
  }

  // --- Android install button ---
  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 bg-card border border-border shadow-2xl rounded-full pl-4 pr-2 py-2">
        <Download className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Install App
        </span>
        <Button
          size="sm"
          className="rounded-full h-8 px-4"
          onClick={handleInstallClick}
          disabled={installing}
        >
          {installing ? 'Installing…' : 'Install'}
        </Button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}