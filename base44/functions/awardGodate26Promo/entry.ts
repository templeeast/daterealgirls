import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PROMO_CODE = "GODATE26";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId } = await req.json();
    if (!memberId) return Response.json({ error: 'memberId required' }, { status: 400 });

    // 1. Load member profile
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ id: memberId });
    const profile = profiles[0];
    if (!profile) return Response.json({ awarded: false, reason: "Profile not found" });

    // 2. Idempotency — no-op if already redeemed
    const usedCodes = profile.used_promo_codes || [];
    if (usedCodes.includes(PROMO_CODE)) {
      return Response.json({ awarded: false, reason: "Already redeemed" });
    }

    // 3. Load active PromoCode record
    const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({ code: PROMO_CODE, is_active: true });
    const promo = promoCodes[0];
    if (!promo) return Response.json({ awarded: false, reason: "Promo not found" });

    const bonusTokens = promo.tokens; // 1000

    // 4. Award tokens and mark code as used
    const newTokens = (profile.tokens || 0) + bonusTokens;
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens:           newTokens,
      used_promo_codes: [...usedCodes, PROMO_CODE],
    });

    // 5. Increment times_used on the PromoCode record
    await base44.asServiceRole.entities.PromoCode.update(promo.id, {
      times_used: (promo.times_used || 0) + 1,
    });

    // 6. Log the token transaction
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id:     profile.user_id,
      type:        "promo",
      tokens:      bonusTokens,
      description: "GODATE26 profile completion welcome bonus",
      promo_code:  PROMO_CODE,
    });

    return Response.json({ awarded: true, bonusTokens, newBalance: newTokens });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});