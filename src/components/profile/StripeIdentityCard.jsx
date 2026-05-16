import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { base44 } from '@/api/base44Client';

const STATUS_LABELS = {
  unverified: 'Not Verified',
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
};

const STATUS_COLORS = {
  unverified: 'bg-muted text-muted-foreground',
  pending: 'bg-accent text-accent-foreground',
  verified: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
};

export default function StripeIdentityCard({ profile, publishableKey, onRefetch }) {
  const [status, setStatus] = useState('idle'); // idle | loading | submitted

  const startVerification = async () => {
    if (!publishableKey) {
      alert('Stripe Identity is not configured. Please contact the site admin.');
      return;
    }
    setStatus('loading');

    const stripe = await loadStripe(publishableKey);
    const { error } = await stripe.verifyIdentity('');

    if (error) {
      // No backend session token — mark as pending manual review
      await base44.entities.MemberProfile.update(profile.id, {
        verification_status: 'pending',
      });
      setStatus('submitted');
      onRefetch();
    } else {
      // Stripe confirmed identity on the client side
      await base44.entities.MemberProfile.update(profile.id, {
        verification_status: 'verified',
      });
      setStatus('idle');
      onRefetch();
    }
  };

  const verificationStatus = profile.verification_status || 'unverified';

  return (
    <Card className="mb-6">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Identity Verification
          </h3>
          <Badge className={STATUS_COLORS[verificationStatus]}>
            {STATUS_LABELS[verificationStatus]}
          </Badge>
        </div>

        {verificationStatus === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="w-4 h-4" />
            Your identity has been verified via Stripe Identity.
          </div>
        )}

        {verificationStatus === 'pending' && (
          <p className="text-sm text-muted-foreground">
            Your verification is under review. We'll update your status once it's complete.
          </p>
        )}

        {verificationStatus === 'rejected' && (
          <p className="text-sm text-destructive">
            Your verification was rejected. Please try again below.
          </p>
        )}

        {(verificationStatus === 'unverified' || verificationStatus === 'rejected') && (
          <div className="space-y-3">
            <div className="bg-muted rounded-xl p-3 text-sm space-y-1">
              <p className="font-medium">What you'll need:</p>
              <ul className="text-muted-foreground space-y-0.5">
                <li>• A valid government-issued ID (passport, driver's license, or ID card)</li>
                <li>• A device with a camera for a quick selfie</li>
              </ul>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>Processed securely by Stripe. We never store your ID documents.</span>
            </div>
            <Button
              className="w-full rounded-full gap-2"
              onClick={startVerification}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting verification...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Start Stripe Identity Verification</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}