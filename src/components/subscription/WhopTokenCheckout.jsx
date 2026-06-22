import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhopTokenCheckout({ packName, devMode, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const divRef = useRef(null);

  // Fetch session from backend
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCheckoutData(null);

    base44.functions.invoke('whopCreateCheckoutSession', { packName })
      .then(res => {
        if (cancelled) return;
        const data = res.data;
        if (data?.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        if (data?.sessionId || data?.planId) {
          setCheckoutData(data);
          setLoading(false);
        } else {
          setError('Failed to create checkout session');
          setLoading(false);
        }
      })
      .catch(err => {
        if (cancelled) return;
        setError(err?.response?.data?.error || err.message || 'Failed to create checkout session');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [packName, retryCount]);

  // Inject Whop loader script once we have a sessionId and the div is mounted
  useEffect(() => {
    const id = checkoutData?.sessionId || checkoutData?.planId;
    if (!id || !divRef.current) return;

    if (checkoutData.checkoutEmail) {
      divRef.current.setAttribute('data-whop-checkout-prefill-email', checkoutData.checkoutEmail);
    }

    // Remove any stale loader script
    const old = document.querySelector('script[data-whop-loader]');
    if (old) old.remove();

    const script = document.createElement('script');
    script.src = 'https://js.whop.com/static/checkout/loader.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-whop-loader', '1');
    document.body.appendChild(script);

    return () => { script.remove(); };
  }, [checkoutData, retryCount]);

  // Listen for checkout completion postMessage
  useEffect(() => {
    const handleMessage = (event) => {
      if (
        event.data?.type === 'checkout.complete' ||
        event.data?.type === 'whop:checkout:complete' ||
        event.data?.status === 'complete'
      ) {
        onComplete();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onComplete]);

  const checkoutId = checkoutData?.sessionId || checkoutData?.planId;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold text-lg">Complete Purchase</span>
          {devMode && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-medium">Sandbox</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Preparing checkout…</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={() => setRetryCount(c => c + 1)} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {checkoutId && !loading && !error && (
          <div
            ref={divRef}
            data-whop-checkout-session-id={checkoutData?.sessionId}
            data-whop-checkout-plan-id={!checkoutData?.sessionId ? checkoutData?.planId : undefined}
            className="w-full h-full"
          />
        )}
      </div>
    </div>
  );
}