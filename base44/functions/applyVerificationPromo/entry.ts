import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { promoCode } = await req.json();

    const normalizedPromo = (promoCode || '').trim().toUpperCase();
    if (!normalizedPromo) {
      return Response.json({ error: 'No promo code provided.' }, { status: 400 });
    }

    // Look up promo code from database (any type)
    const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({ code: normalizedPromo, is_active: true });
    const promoRecord = promoCodes.find(p => p.type === 'verification' || p.type === 'purchase' || p.type === 'any');

    if (!promoRecord) {
      return Response.json({ error: 'Invalid promo code.' }, { status: 400 });
    }

    // Check expiry
    if (promoRecord.expires_at && new Date(promoRecord.expires_at) < new Date()) {
      return Response.json({ error: 'This promo code has expired.' }, { status: 400 });
    }

    // Check max uses
    if (promoRecord.max_uses && promoRecord.times_used >= promoRecord.max_uses) {
      return Response.json({ error: 'This promo code has reached its usage limit.' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const profile = profiles[0];

    // Must be verified to use verification promos (purchase and any can always be used)
    if (promoRecord.type === 'verification' && profile.verification_status !== 'verified') {
      return Response.json({ error: 'Your ID must be verified before applying this promo code.' }, { status: 400 });
    }

    // Check if already used
    const usedCodes = profile.used_promo_codes || [];
    if (usedCodes.includes(normalizedPromo)) {
      return Response.json({ error: 'This promo code has already been used.' }, { status: 400 });
    }

    const newTokens = (profile.tokens || 0) + promoRecord.tokens;
    const newUsedCodes = [...usedCodes, normalizedPromo];

    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens: newTokens,
      used_promo_codes: newUsedCodes,
    });

    // Increment times_used on the promo record
    await base44.asServiceRole.entities.PromoCode.update(promoRecord.id, {
      times_used: (promoRecord.times_used || 0) + 1,
    });

    // Log the promo transaction
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id: user.id,
      type: 'promo',
      tokens: promoRecord.tokens,
      description: promoRecord.description || `Promo code ${normalizedPromo} bonus`,
      promo_code: normalizedPromo,
    });

    return Response.json({
      success: true,
      bonusTokens: promoRecord.tokens,
      newBalance: newTokens,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});