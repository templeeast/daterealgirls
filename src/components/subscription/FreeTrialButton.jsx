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
    <div className="p-4 bg-primary/5 border-2 border-primary/40 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        <p className="font-semibold text-sm text-primary">Try Premium FREE for 30 Days</p>
        <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold">Best Value</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Get full Premium access — unlimited browsing &amp; messaging — for an entire month. <strong>No credit card required.</strong>
      </p>
      <Button className="w-full gap-2 rounded-full text-base font-semibold" size="lg" onClick={handleClaim} disabled={claiming}>
        <Gift className="w-5 h-5" />
        {claiming ? 'Activating...' : '🎁 Claim Your Free Month'}
      </Button>
    </div>
  );
}