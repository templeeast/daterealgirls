import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const WINK_COST_MEN = 5;

// Wink emoji icon – no lucide import needed
export default function WinkButton({ myProfile, targetProfileId, existingWink, onWinked, size = 'default' }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(!!existingWink);

  const isMale = myProfile?.gender === 'male';
  const winkCost = isMale ? WINK_COST_MEN : 0;

  const handleWink = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (sent) {
      toast({ title: t('wink_already_sent') });
      return;
    }

    if (isMale && (myProfile?.tokens || 0) < WINK_COST_MEN) {
      toast({ title: t('wink_insufficient_tokens'), variant: 'destructive' });
      return;
    }

    setLoading(true);

    if (isMale) {
      await base44.entities.MemberProfile.update(myProfile.id, {
        tokens: (myProfile.tokens || 0) - WINK_COST_MEN,
      });
      await base44.entities.TokenTransaction.create({
        user_id: myProfile.user_id,
        type: 'spend',
        tokens: -WINK_COST_MEN,
        description: 'Sent a wink',
      });
    }

    await base44.entities.Wink.create({
      sender_id: myProfile.user_id,
      recipient_profile_id: targetProfileId,
      sender_name: myProfile.display_name,
      sender_photo: myProfile.photo_1 || '',
    });
    setSent(true);
    toast({ title: t('wink_sent_toast') });
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
      title={sent ? t('wink_btn_sent') : t('wink_btn')}
    >
      <span className="text-base leading-none">😉</span>
      {size !== 'icon' && (sent ? t('wink_btn_sent') : `${t('wink_btn')}${winkCost > 0 ? ` (${winkCost})` : ''}`)}
    </Button>
  );
}