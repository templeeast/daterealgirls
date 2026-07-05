import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Coins, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

/**
 * Dialog to purchase unlimited browsing for 7 days.
 * Requires the user to be verified first — if not, redirects to /my-profile.
 */
export default function BrowseAllDialog({ open, onOpenChange, browseCost, currentTokens, isVerified, onSuccess }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);

  const canAfford = currentTokens >= browseCost;

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const res = await base44.functions.invoke('unlockBrowseAll', { browseCost });
      if (res.data?.success) {
        toast({ title: t('browse_all_unlocked_toast', { tokens: res.data.tokensSpent }) });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast({ title: res.data?.error || 'Failed to unlock', variant: 'destructive' });
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to unlock';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setPurchasing(false);
    }
  };

  const handleVerifyFirst = () => {
    onOpenChange(false);
    navigate('/my-profile');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> {t('browse_all_dialog_title')}
          </DialogTitle>
          <DialogDescription>{t('browse_all_dialog_desc')}</DialogDescription>
        </DialogHeader>

        {!isVerified ? (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
              <Shield className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-sm">{t('browse_all_verify_first')}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between bg-muted rounded-lg p-3">
              <span className="text-sm text-muted-foreground">{t('browse_all_cost_label')}</span>
              <span className="font-bold text-primary">{browseCost} tokens</span>
            </div>
            <div className="flex items-center justify-between bg-muted rounded-lg p-3">
              <span className="text-sm text-muted-foreground">{t('browse_all_duration_label')}</span>
              <span className="font-medium">7 {t('browse_all_days')}</span>
            </div>
            <div className="flex items-center justify-between bg-muted rounded-lg p-3">
              <span className="text-sm text-muted-foreground">{t('browse_all_balance_label')}</span>
              <span className={`font-medium ${canAfford ? 'text-green-600' : 'text-destructive'}`}>
                {currentTokens.toLocaleString()} tokens
              </span>
            </div>
            {!canAfford && (
              <p className="text-sm text-destructive">
                {t('browse_all_insufficient', { needed: (browseCost - currentTokens).toLocaleString() })}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={purchasing}>
            {t('browse_all_cancel')}
          </Button>
          {!isVerified ? (
            <Button onClick={handleVerifyFirst} className="gap-2">
              <Shield className="w-4 h-4" /> {t('browse_all_verify_btn')}
            </Button>
          ) : (
            <Button onClick={handlePurchase} disabled={purchasing || !canAfford} className="gap-2">
              {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
              {t('browse_all_unlock_btn', { cost: browseCost })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}