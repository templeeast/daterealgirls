import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import useSiteConfig from '@/hooks/useSiteConfig';

export default function AdFreeCard({ profile, onRefetch }) {
  const { config } = useSiteConfig();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = useState(false);

  const enabled = config?.ad_free_enabled !== false;
  const cost = config?.ad_free_token_cost ?? 200;
  const days = config?.ad_free_duration_days ?? 7;
  const tokens = profile?.tokens ?? 0;

  const adFreeUntil = profile?.ad_free_until;
  const isActive = adFreeUntil && new Date(adFreeUntil) > new Date();
  const insufficient = tokens < cost;

  if (!enabled) return null;

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await base44.functions.invoke('purchaseAdFree', {});
      if (res.data?.success) {
        toast({ title: t('ad_free_activated_toast', { tokens: res.data.tokensSpent, days }) });
        onRefetch();
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
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-primary" /> {t('ad_free_title')}
        </CardTitle>
        <CardDescription>{t('ad_free_desc', { days })}</CardDescription>
      </CardHeader>
      <CardContent>
        {isActive ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium">
              {t('ad_free_active_until', { date: format(new Date(adFreeUntil), 'MMM d, yyyy') })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('ad_free_duration_label')}</span>
                <span className="text-sm font-medium">{days} {t('ad_free_days')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('ad_free_cost_label')}</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-primary" /> {cost}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('ad_free_balance_label')}</span>
                <span className="text-sm font-medium">{tokens.toLocaleString()}</span>
              </div>
            </div>
            {insufficient && (
              <p className="text-sm text-destructive">{t('ad_free_insufficient', { needed: cost - tokens })}</p>
            )}
            <Button
              className="w-full gap-2 rounded-full"
              onClick={handlePurchase}
              disabled={purchasing || insufficient}
            >
              {purchasing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('ad_free_purchasing')}</>
              ) : (
                <><EyeOff className="w-4 h-4" /> {t('ad_free_activate_btn', { cost })}</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}