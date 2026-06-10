import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { addMonths, format } from 'date-fns';

// Hosted form URL is driven by the token fetch (sandbox vs production is handled backend-side)
// The correct Accept Hosted endpoints are:
// Sandbox:    https://test.authorize.net/payment/payment
// Production: https://accept.authorize.net/payment/payment

export default function AuthorizeNetHostedButton({ price, onSuccess, devMode = false }) {
  const HOSTED_FORM_URL = devMode
    ? 'https://test.authorize.net/payment/payment'
    : 'https://accept.authorize.net/payment/payment';
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [showIframe, setShowIframe] = useState(false);
  const formRef = useRef(null);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/my-profile`;
      const res = await base44.functions.invoke('authorizeNetGetHostedToken', {
        amount: price,
        returnUrl,
        cancelUrl: returnUrl,
      });

      if (res.data?.error) {
        toast({ title: res.data.error, variant: 'destructive' });
        return;
      }

      setToken(res.data.token);
      setShowIframe(true);

      // Submit the hidden form after state update
      setTimeout(() => {
        formRef.current?.submit();
      }, 100);
    } catch (err) {
      toast({ title: err?.response?.data?.error || 'Failed to load payment form.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowIframe(false);
    setToken(null);
  };

  // Listen for messages from the iframe (Authorize.net communicator)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // Authorize.net communicator sends query-string format: "action=...&..."
        let data;
        if (typeof event.data === 'string' && event.data.includes('action=')) {
          const params = new URLSearchParams(event.data);
          data = { action: params.get('action'), response: params.get('response') };
        } else {
          data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        }
        if (data?.action === 'resizeWindow') return; // ignore resize events
        if (data?.action === 'transactResponse') {
          const response = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
          if (response?.responseCode === '1') {
            // Approved — update subscription in DB
            setShowIframe(false);
            setToken(null);
            (async () => {
              try {
                const user = await base44.auth.me();
                const profiles = await base44.entities.MemberProfile.filter({ user_id: user.id });
                if (profiles?.[0]) {
                  const today = new Date();
                  await base44.entities.MemberProfile.update(profiles[0].id, {
                    subscription_status: 'active',
                    subscription_start_date: format(today, 'yyyy-MM-dd'),
                    subscription_end_date: format(addMonths(today, 1), 'yyyy-MM-dd'),
                  });
                }
              } catch (e) {
                console.error('Failed to update subscription:', e);
              }
              toast({ title: '✓ Payment successful! Your subscription is now active.' });
              onSuccess?.();
            })();
          } else {
            const msg = response?.errors?.[0]?.errorText || 'Payment was not completed.';
            toast({ title: msg, variant: 'destructive' });
          }
        }
        if (data?.action === 'cancel') {
          handleClose();
        }
      } catch {
        // not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  return (
    <>
      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        size="lg"
        onClick={handleOpen}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Loading payment form...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay ${price}/month</>
        )}
      </Button>

      {/* Hidden form that POSTs token to Authorize.net hosted form */}
      {token && (
        <form
          ref={formRef}
          method="post"
          action={HOSTED_FORM_URL}
          target="authnet-iframe"
          className="hidden"
        >
          <input type="hidden" name="token" value={token} />
        </form>
      )}

      {/* Iframe modal */}
      {showIframe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
               style={{ height: 'min(90vh, 700px)', maxHeight: '90vh' }}>
            <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0">
              <span className="font-semibold text-sm">Secure Payment</span>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <iframe
                name="authnet-iframe"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="yes"
                style={{ minHeight: '500px', display: 'block' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}