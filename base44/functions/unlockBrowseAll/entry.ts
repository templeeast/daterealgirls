import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { browseCost } = body;

    // Find the member profile
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    // Must be verified
    if (profile.verification_status !== 'verified') {
      return Response.json({ error: 'You must complete ID verification first.' }, { status: 403 });
    }

    const cost = typeof browseCost === 'number' ? browseCost : 100;
    const currentTokens = profile.tokens || 0;

    if (currentTokens < cost) {
      return Response.json({
        error: `Insufficient tokens. You need ${cost} tokens to unlock unlimited browsing.`,
        tokensNeeded: cost - currentTokens,
      }, { status: 402 });
    }

    // Deduct tokens and set unlock window to 7 days from now
    const unlockedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens: currentTokens - cost,
      browse_unlocked_until: unlockedUntil,
      browse_count_this_week: 0,
      browse_week_start: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id: user.id,
      type: 'spend',
      tokens: -cost,
      description: 'Unlocked unlimited browsing (7 days)',
    });

    return Response.json({
      success: true,
      tokensSpent: cost,
      remainingTokens: currentTokens - cost,
      browseUnlockedUntil: unlockedUntil,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});