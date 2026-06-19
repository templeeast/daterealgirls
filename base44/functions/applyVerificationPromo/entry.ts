import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const VERIFICATION_PROMO_CODES = {
  LAUNCH26: { tokens: 5000, description: '5,000 bonus tokens for ID Verification' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { promoCode } = await req.json();

    const normalizedPromo = (promoCode || '').trim().toUpperCase();
    const promoInfo = VERIFICATION_PROMO_CODES[normalizedPromo];

    if (!promoInfo) {
      return Response.json({ error: 'Invalid promo code.' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const profile = profiles[0];

    // Must be verified to use verification promo
    if (profile.verification_status !== 'verified') {
      return Response.json({ error: 'Your ID must be verified before applying this promo code.' }, { status: 400 });
    }

    // Check if already used
    const usedCodes = profile.used_promo_codes || [];
    if (usedCodes.includes(normalizedPromo)) {
      return Response.json({ error: 'This promo code has already been used.' }, { status: 400 });
    }

    const newTokens = (profile.tokens || 0) + promoInfo.tokens;
    const newUsedCodes = [...usedCodes, normalizedPromo];

    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens: newTokens,
      used_promo_codes: newUsedCodes,
    });

    return Response.json({
      success: true,
      bonusTokens: promoInfo.tokens,
      newBalance: newTokens,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});