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

    // Gender targeting
    if (promoRecord.gender && promoRecord.gender !== 'all' && promoRecord.gender !== profile.gender) {
      return Response.json({ error: 'This promo code is not available for your gender.' }, { status: 400 });
    }

    // Verification type requires ID verification
    if (promoRecord.type === 'verification' && profile.verification_status !== 'verified') {
      return Response.json({ error: 'Your ID must be verified before applying this promo code.' }, { status: 400 });
    }

    // Check if already used
    const usedCodes = profile.used_promo_codes || [];
    if (usedCodes.includes(normalizedPromo)) {
      return Response.json({ error: 'This promo code has already been used.' }, { status: 400 });
    }

    // For purchase-type promos before first purchase, register but don't award tokens yet
    const isPurchasePromoBeforePurchase = promoRecord.type === 'purchase' && !profile.has_purchased_tokens;
    const newUsedCodes = [...usedCodes, normalizedPromo];

    if (isPurchasePromoBeforePurchase) {
      // Just register the promo, tokens will be awarded on first purchase
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        used_promo_codes: newUsedCodes,
      });
      return Response.json({
        success: true,
        bonusTokens: 0,
        newBalance: profile.tokens || 0,
        pending: true,
        message: 'Promo applied! Your tokens will be awarded when you make your first purchase.',
      });
    }

    // Award tokens immediately for verification-type and 'any' promos
    const newTokens = (profile.tokens || 0) + promoRecord.tokens;
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