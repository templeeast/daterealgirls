import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function FreeTrialButton({ profile, onSuccess }) {
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  // Only show if male, never claimed trial, and not currently/previously subscribed
  const isEligible =
    profile.gender === 'male' &&
    !profile.free_trial_claimed &&
    profile.subscription_status === 'free';

  if (!isEligible) return null;

  const handleClaim = async () => {
    setClaiming(true);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    await base44.entities.MemberProfile.update(profile.id, {
      free_trial_claimed: true,
      free_trial_start_date: today.toISOString().split('T')[0],
      subscription_status: 'active',
      subscription_start_date: today.toISOString().split('T')[0],
      subscription_end_date: endDate.toISOString().split('T')[0],
    });

    toast({ title: '🎉 Free month activated!', description: 'You now have full Premium access for 30 days.' });
    setClaiming(false);
    onSuccess?.();
  };

  return (
    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        <p className="font-semibold text-sm text-primary">Free Month Offer</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Try Premium free for 30 days — unlimited browsing, messaging, and more. No payment required to start.
      </p>
      <Button className="w-full gap-2 rounded-full" onClick={handleClaim} disabled={claiming}>
        <Gift className="w-4 h-4" />
        {claiming ? 'Activating...' : 'Claim Free Month'}
      </Button>
    </div>
  );
}