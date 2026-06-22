import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function buildCheckoutUrl(sessionId, planId, checkoutEmail, isDevMode) {
  const id = sessionId || planId;
  const storefrontBase = isDevMode ? 'https://sandbox.whop.com' : 'https://whop.com';
  const base = `${storefrontBase}/checkout/${id}/`;
  const params = new URLSearchParams();
  params.set('d2c', 'true');
  if (checkoutEmail) params.set('prefilled_email', checkoutEmail);
  return `${base}?${params.toString()}`;
}

export default function WhopTokenCheckout({ packName, devMode, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setCheckoutUrl(null);
    setOpened(false);

    base44.functions.invoke('whopCreateCheckoutSession', { packName })
      .then(res => {
        if (cancelled) return;
        const data = res.data;
        if (data?.error) { setError(data.error); setLoading(false); return; }
        if (data?.planId || data?.sessionId) {
          const url = buildCheckoutUrl(data.sessionId, data.planId, data.checkoutEmail, data.isDevMode);
          setCheckoutUrl(url);
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

  const handleOpenCheckout = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
      setOpened(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold text-lg">Complete Purchase</span>
            {devMode && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full font-medium">Sandbox</span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-8 flex flex-col items-center gap-5 text-center">
          {loading && (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparing checkout…</p>
            </>
          )}

          {error && (
            <>
              <p className="text-destructive font-medium">{error}</p>
              <Button onClick={() => setRetryCount(c => c + 1)} variant="outline">Try Again</Button>
            </>
          )}

          {checkoutUrl && !loading && !error && !opened && (
            <>
              <p className="text-muted-foreground text-sm">Click below to open the secure Whop checkout in a new tab. Return here once your payment is complete.</p>
              <Button onClick={handleOpenCheckout} className="w-full gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Checkout
              </Button>
            </>
          )}

          {opened && (
            <>
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="font-medium">Checkout opened in a new tab</p>
                <p className="text-sm text-muted-foreground mt-1">Complete your payment there, then click "I've Paid" below.</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={onComplete} className="w-full">I've Paid — Continue</Button>
                <Button onClick={handleOpenCheckout} variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Reopen Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}