import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import StripeIdentityStep from '@/components/onboarding/StripeIdentityStep';
import { ShieldCheck } from 'lucide-react';

export default function StripeIdentityGate() {
  const { config, isLoading: configLoading } = useSiteConfig();
  const { profile, isLoading: profileLoading, refetch } = useMyProfile();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (configLoading || profileLoading) return;
    // Show gate if: stripe identity is required AND the user's profile exists AND is unverified
    if (
      config?.require_stripe_identity === true &&
      profile &&
      profile.verification_status === 'unverified'
    ) {
      setOpen(true);
    }
  }, [config, profile, configLoading, profileLoading]);

  const handleVerified = async () => {
    if (profile?.id) {
      await base44.entities.MemberProfile.update(profile.id, { verification_status: 'pending' });
      await refetch();
    }
    setOpen(false);
  };

  // No skip — this is a post-login enforcement gate. User must complete or dismiss.
  // We still allow closing (onSkip = close) so they're not completely locked out,
  // but it will re-appear on each visit until verified.
  const handleDismiss = () => setOpen(false);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <DialogTitle className="font-heading">Identity Verification Required</DialogTitle>
          </div>
          <DialogDescription>
            Our platform now requires identity verification for all members. Please complete this quick step to continue.
          </DialogDescription>
        </DialogHeader>
        <StripeIdentityStep
          publishableKey={config?.stripe_identity_publishable_key}
          onVerified={handleVerified}
          onSkip={handleDismiss}
        />
      </DialogContent>
    </Dialog>
  );
}