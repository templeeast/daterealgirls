// Shared verification-fee logic used by the Didit webhook (charge) and the
// token-granting functions (settle).
//
// The ID verification token fee may be due before the member has any token
// balance. We charge what we can at verification time and record the remainder
// as `verification_fee_owed` on the MemberProfile; every token grant then
// settles that debt from the freshly-granted balance.

export function getVerificationFee(config, profile) {
  const isMale = profile?.gender === 'male';
  const enabled = isMale
    ? config.tokens_verify_men_enabled
    : config.tokens_verify_women_enabled;
  if (!enabled) return 0;
  const cost = isMale
    ? (config.tokens_verify_cost_men ?? 300)
    : (config.tokens_verify_cost_women ?? 300);
  return cost > 0 ? cost : 0;
}

// Charge the verification fee the moment a profile becomes verified. Deducts
// from the current balance; any uncollectable remainder is stored as
// `verification_fee_owed` and collected later via settleVerificationFee.
export async function chargeVerificationFee(base44, profile, config) {
  const fee = getVerificationFee(config, profile);
  if (fee <= 0) return { charged: 0, owed: 0 };

  const balance = profile.tokens || 0;
  const chargedNow = Math.min(fee, Math.max(0, balance));
  const owed = fee - chargedNow;
  const newBalance = balance - chargedNow;

  await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
    tokens: newBalance,
    verification_fee_owed: owed,
  });

  if (chargedNow > 0) {
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id: profile.user_id,
      type: 'spend',
      tokens: -chargedNow,
      description: 'ID verification fee',
    });
  }
  return { charged: chargedNow, owed };
}

// Settle an owed verification fee from the profile's current balance. Call this
// right after granting tokens (purchases, bonuses, promos). Re-fetches the
// profile so the just-granted balance is reflected.
export async function settleVerificationFee(base44, profile, config) {
  const owed = profile.verification_fee_owed || 0;
  if (owed <= 0) return { settled: 0 };

  const fresh = (await base44.asServiceRole.entities.MemberProfile.filter({ id: profile.id }))[0] || profile;
  const balance = fresh.tokens || 0;
  const settle = Math.min(owed, Math.max(0, balance));
  if (settle <= 0) return { settled: 0 };

  await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
    tokens: balance - settle,
    verification_fee_owed: owed - settle,
  });

  await base44.asServiceRole.entities.TokenTransaction.create({
    user_id: profile.user_id,
    type: 'spend',
    tokens: -settle,
    description: 'ID verification fee (collected from token grant)',
  });

  return { settled: settle };
}