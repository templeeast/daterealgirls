import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Renders the Whop embedded checkout inside a modal overlay.
 * Uses Whop's official loader script + data-attribute approach.
 * The div must be in the DOM before the script initializes it,
 * so we append the script tag after mount.
 */
export default function WhopEmbeddedCheckout({ planId, prefillEmail, prefillName, onClose, devMode }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!planId || !divRef.current) return;

    // Set prefill attributes on the checkout div
    if (prefillEmail) divRef.current.setAttribute('data-whop-checkout-prefill-email', prefillEmail);
    if (prefillName) divRef.current.setAttribute('data-whop-checkout-prefill-name', prefillName);

    // Remove any previous Whop loader script
    const old = document.querySelector('script[data-whop-loader]');
    if (old) old.remove();

    // Append a fresh loader script so it finds the div already in the DOM
    const script = document.createElement('script');
    script.src = 'https://js.whop.com/static/checkout/loader.js';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-whop-loader', '1');
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [planId, prefillEmail, prefillName]);

  if (!planId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-heading text-lg font-semibold">Subscribe via Whop</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div
            ref={divRef}
            data-whop-checkout-plan-id={planId}
          />
        </div>
      </div>
    </div>
  );
}