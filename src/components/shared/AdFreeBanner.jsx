import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Coins, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Compact inline banner that lets users purchase ad-free time with tokens.
 * Shows near ad placements on Winks, Messages, Favorites, and Profile pages.
 * Renders nothing when ad-free is already active or the feature is disabled.
 */
export default function AdFreeBanner() {
  const { config } = useSiteConfig();
  const { profile, refetch } = useMyProfile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [purchasing, setPurchasing] = useState(false);

  const enabled = config?.ad_free_enabled !== false;
  const cost = config?.ad_free_token_cost ?? 200;
  const days = config?.ad_free_duration_days ?? 7;
  const tokens = profile?.tokens ?? 0;

  const adFreeUntil = profile?.ad_free_until;
  const isActive = adFreeUntil && new Date(adFreeUntil) > new Date();
  const insufficient = tokens < cost;

  if (!enabled || isActive) return null;

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await base44.functions.invoke('purchaseAdFree', {});
      if (res.data?.success) {
        toast({ title: t('ad_free_activated_toast', { tokens: res.data.tokensSpent, days }) });
        await refetch();
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      } else {
        toast({ title: res.data?.error || 'Failed', variant: 'destructive' });
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed';
      toast({ title: errorMsg, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="my-3 flex items-center justify-between gap-3 bg-accent/60 border border-primary/15 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <EyeOff className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {t('ad_free_desc', { days })}
        </span>
      </div>
      <Button
        size="sm"
        className="shrink-0 gap-1.5 rounded-full"
        onClick={handlePurchase}
        disabled={purchasing || insufficient}
      >
        {purchasing ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('ad_free_purchasing')}</>
        ) : (
          <><Coins className="w-3.5 h-3.5" /> {cost}</>
        )}
      </Button>
    </div>
  );
}