import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Dynamic promo code suggestions banner for the Buy Tokens section.
 * Fetches active promo codes and filters out:
 *   - Codes the user has already redeemed (in used_promo_codes)
 *   - Codes marked auto_award (awarded automatically, not for manual entry)
 *   - Hidden, expired, or maxed-out codes
 *   - Verification-type codes when the user is not yet verified
 */
export default function PromoSuggestionsBanner({ profile }) {
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['activePromoCodes'],
    queryFn: () => base44.entities.PromoCode.filter({ is_active: true }),
  });

  const usedCodes = profile?.used_promo_codes || [];
  const isVerified = profile?.verification_status === 'verified';
  const hasPurchased = profile?.has_purchased_tokens;

  const suggestions = useMemo(() => {
    const now = new Date();
    return promoCodes.filter(p => {
      if (p.visible === false) return false;
      if (p.auto_award === true) return false;
      if (usedCodes.includes(p.code)) return false;
      if (p.expires_at && new Date(p.expires_at) < now) return false;
      if (p.max_uses && (p.times_used || 0) >= p.max_uses) return false;
      if (p.type === 'verification' && !isVerified) return false;
      // Purchase-type codes are only useful as suggestions before first purchase
      if (p.type === 'purchase' && hasPurchased) return false;
      return true;
    });
  }, [promoCodes, usedCodes, isVerified, hasPurchased]);

  if (isLoading || suggestions.length === 0) return null;

  return (
    <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
      <span className="text-2xl">🎁</span>
      <div className="space-y-1">
        {suggestions.map(p => (
          <p key={p.id} className="text-sm">
            Use Promo Code{' '}
            <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-semibold">{p.code}</span>{' '}
            {p.type === 'verification'
              ? 'after ID Verification to get'
              : p.type === 'purchase'
              ? 'with your first token purchase to get'
              : 'to get'}{' '}
            <strong>{(p.tokens || 0).toLocaleString()} free tokens</strong>.
          </p>
        ))}
      </div>
    </div>
  );
}