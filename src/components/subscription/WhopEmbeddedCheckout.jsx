import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WhopEmbeddedCheckout({ planId, prefillEmail, prefillName, onClose, devMode }) {
  const containerRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Remove any existing Whop loader script to avoid duplicates
    const existingScript = document.querySelector('script[src*="js.whop.com"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.whop.com/static/checkout/loader.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove the script on unmount — it may be needed again
    };
  }, []);

  if (!planId) return null;

  const baseUrl = devMode ? 'https://sandbox.whop.com' : 'https://whop.com';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-heading text-lg font-semibold">Subscribe via Whop</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4" ref={containerRef}>
          <div
            data-whop-checkout-plan-id={planId}
            {...(prefillEmail ? { 'data-whop-checkout-prefill-email': prefillEmail } : {})}
            {...(prefillName ? { 'data-whop-checkout-prefill-name': prefillName } : {})}
          />
        </div>
      </div>
    </div>
  );
}