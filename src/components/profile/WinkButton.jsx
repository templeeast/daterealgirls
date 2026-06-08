import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Wink emoji icon – no lucide import needed
export default function WinkButton({ myProfile, targetProfileId, existingWink, onWinked, size = 'default' }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(!!existingWink);

  const isPremium = myProfile?.subscription_status === 'active';

  const handleWink = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isPremium) {
      toast({ title: 'Upgrade to Premium to send winks 😉', variant: 'destructive' });
      return;
    }

    if (sent) {
      toast({ title: 'You already winked at this person!' });
      return;
    }

    setLoading(true);
    await base44.entities.Wink.create({
      sender_id: myProfile.user_id,
      recipient_profile_id: targetProfileId,
      sender_name: myProfile.display_name,
      sender_photo: myProfile.photo_1 || '',
    });
    setSent(true);
    toast({ title: '😉 Wink sent!' });
    onWinked?.();
    setLoading(false);
  };

  return (
    <Button
      variant={sent ? 'secondary' : 'outline'}
      size={size}
      className="gap-1.5 rounded-full"
      onClick={handleWink}
      disabled={loading || sent}
      title={sent ? 'Wink sent' : 'Send a wink'}
    >
      <span className="text-base leading-none">😉</span>
      {size !== 'icon' && (sent ? 'Winked' : 'Wink')}
    </Button>
  );
}