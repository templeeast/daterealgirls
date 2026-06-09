import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function WhopReturn() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const status = params.get('checkout_status') || params.get('status');
  const isSuccess = status === 'success';

  const [activating, setActivating] = useState(isSuccess);
  const [activated, setActivated] = useState(false);
  const [activationMsg, setActivationMsg] = useState('');

  useEffect(() => {
    if (!isSuccess) return;

    // Poll up to ~15s (3 attempts), then give up gracefully — webhook handles activation
    let attempts = 0;
    const maxAttempts = 3;
    const delay = 4000;

    const tryActivate = async () => {
      attempts++;
      try {
        const res = await base44.functions.invoke('whopActivateSubscription', {});
        if (res.data?.activated) {
          setActivated(true);
          setActivating(false);
          return;
        }
      } catch (_) {
        // ignore errors, keep polling
      }
      if (attempts < maxAttempts) {
        setTimeout(tryActivate, delay);
      } else {
        // Give up — webhook will activate in the background
        setActivationMsg('Your payment was received! Your subscription will be activated within a few minutes.');
        setActivating(false);
      }
    };

    setTimeout(tryActivate, delay);
  }, [isSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        {isSuccess ? (
          <>
            {activating ? (
              <>
                <Loader2 className="w-20 h-20 text-primary mx-auto animate-spin" />
                <h1 className="font-heading text-3xl font-bold">Activating your subscription…</h1>
                <p className="text-muted-foreground text-lg">
                  Please wait while we confirm your payment with Whop.
                </p>
              </>
            ) : activated ? (
              <>
                <CheckCircle className="w-20 h-20 text-primary mx-auto" />
                <h1 className="font-heading text-3xl font-bold">Payment Successful!</h1>
                <p className="text-muted-foreground text-lg">
                  Welcome to Premium! Your subscription is now active. You can now browse and connect with all members.
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-20 h-20 text-primary mx-auto" />
                <h1 className="font-heading text-3xl font-bold">Payment Received!</h1>
                <p className="text-muted-foreground text-lg">
                  {activationMsg || 'Your subscription will be activated shortly.'}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <XCircle className="w-20 h-20 text-destructive mx-auto" />
            <h1 className="font-heading text-3xl font-bold">Payment Failed</h1>
            <p className="text-muted-foreground text-lg">
              Something went wrong with your payment. Please try again or contact support if the issue persists.
            </p>
          </>
        )}
        {!activating && (
          <Button
            size="lg"
            className="rounded-full px-8"
            onClick={() => navigate(isSuccess ? '/my-profile' : '/')}
          >
            {isSuccess ? 'Go to My Profile' : 'Return to Home'}
          </Button>
        )}
      </div>
    </div>
  );
}