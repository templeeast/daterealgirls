import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Determines which active promo codes a user is eligible for and hasn't claimed yet.
 * Renders a green card per eligible promo (same style as the former LAUNCH26 card).
 */
export default function EligiblePromosCard({ profile, onRefetch }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applyingCode, setApplyingCode] = useState(null);
  const [customInputs, setCustomInputs] = useState({});

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['activePromoCodes'],
    queryFn: () => base44.entities.PromoCode.filter({ is_active: true }),
  });

  const usedCodes = profile?.used_promo_codes || [];
  const isVerified = profile?.verification_status === 'verified';

  const eligiblePromos = useMemo(() => {
    const now = new Date();
    return promoCodes.filter(p => {
      if (p.visible === false) return false;
      if (p.auto_award === true) return false;
      if (usedCodes.includes(p.code)) return false;
      if (p.expires_at && new Date(p.expires_at) < now) return false;
      if (p.max_uses && (p.times_used || 0) >= p.max_uses) return false;
      if (p.type === 'verification' && !isVerified) return false;
      return true;
    });
  }, [promoCodes, usedCodes, isVerified]);

  if (isLoading || eligiblePromos.length === 0) return null;

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
      {eligiblePromos.map(promo => (
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