import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

/**
 * Determines which active promo codes a user is eligible for and hasn't claimed yet.
 * - Claimable: verification-type (verified only) + any-type. Purchase-type is shown in PromoSuggestionsBanner (Buy Tokens).
 * - Teaser: verification-type codes shown to UNVERIFIED users, prompting them to verify first.
 */
export default function EligiblePromosCard({ profile, onRefetch }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [applyingCode, setApplyingCode] = useState(null);
  const [customInputs, setCustomInputs] = useState({});

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['activePromoCodes'],
    queryFn: () => base44.entities.PromoCode.filter({ is_active: true }),
  });

  const usedCodes = profile?.used_promo_codes || [];
  const isVerified = profile?.verification_status === 'verified';

  const claimablePromos = useMemo(() => {
    const now = new Date();
    return promoCodes.filter(p => {
      if (p.visible === false) return false;
      if (p.auto_award === true) return false;
      if (p.type === 'purchase') return false; // shown in Buy Tokens section
      if (usedCodes.includes(p.code)) return false;
      if (p.expires_at && new Date(p.expires_at) < now) return false;
      if (p.max_uses && (p.times_used || 0) >= p.max_uses) return false;
      if (p.type === 'verification' && !isVerified) return false;
      return true;
    });
  }, [promoCodes, usedCodes, isVerified]);

  const verificationTeaserPromos = useMemo(() => {
    if (isVerified) return [];
    const now = new Date();
    return promoCodes.filter(p => {
      if (p.visible === false) return false;
      if (p.auto_award === true) return false;
      if (p.type !== 'verification') return false;
      if (usedCodes.includes(p.code)) return false;
      if (p.expires_at && new Date(p.expires_at) < now) return false;
      if (p.max_uses && (p.times_used || 0) >= p.max_uses) return false;
      return true;
    });
  }, [promoCodes, usedCodes, isVerified]);

  if (isLoading || (claimablePromos.length === 0 && verificationTeaserPromos.length === 0)) return null;

  const handleApply = async (code) => {
    setApplyingCode(code);
    try {
      const res = await base44.functions.invoke('applyVerificationPromo', { promoCode: code });
      if (res.data?.pending) {
        toast({ title: res.data.message || 'Promo applied! Tokens will be awarded on your first purchase.' });
      } else {
        toast({ title: `🎉 ${res.data.bonusTokens.toLocaleString()} bonus tokens added!` });
      }
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activePromoCodes'] });
      onRefetch?.();
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Invalid promo code';
      toast({ title: errorMsg, variant: 'destructive' });
    } finally {
      setApplyingCode(null);
    }
  };

  const handleCustomApply = async (code) => {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return;
    await handleApply(trimmed);
    setCustomInputs({});
  };

  return (
    <>
      {/* Verification teaser — shown to unverified users for verification-type promos */}
      {verificationTeaserPromos.map(promo => (
        <Card key={`teaser-${promo.id}`} className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">
                  {t('promo_verify_teaser_title', { tokens: promo.tokens.toLocaleString() })}
                </p>
                <p className="text-sm text-blue-700 mt-0.5">
                  {t('promo_verify_teaser_desc', { code: promo.code, tokens: promo.tokens.toLocaleString() })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Claimable promos */}
      {claimablePromos.map(promo => (
        <Card key={promo.id} className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800">
                  {promo.type === 'verification'
                    ? 'Verified! Claim your bonus tokens'
                    : promo.type === 'purchase'
                    ? 'Bonus tokens available with your next purchase'
                    : 'Claim your bonus tokens'}
                </p>
                <p className="text-sm text-green-700">
                  Enter promo code <span className="font-mono font-bold">{promo.code}</span>{' '}
                  {promo.type === 'purchase'
                    ? promo.has_purchased_tokens
                      ? 'to receive'
                      : 'and it will be applied to your first purchase for'
                    : 'to receive'}{' '}
                  <strong>{promo.tokens.toLocaleString()} free tokens</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Enter ${promo.code}`}
                value={customInputs[promo.id] ?? ''}
                onChange={e => setCustomInputs(prev => ({ ...prev, [promo.id]: e.target.value.toUpperCase() }))}
                onKeyDown={e => e.key === 'Enter' && customInputs[promo.id] && handleCustomApply(customInputs[promo.id])}
                className="font-mono flex-1"
              />
              <Button
                onClick={() => handleCustomApply(customInputs[promo.id])}
                disabled={applyingCode === promo.code || !(customInputs[promo.id] || '').trim()}
                className="shrink-0"
              >
                {applyingCode === promo.code ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}