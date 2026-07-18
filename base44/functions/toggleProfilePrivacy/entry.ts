import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    const profile = profiles[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0];

    const cost = config?.tokens_profile_privacy_toggle_cost ?? 100;
    const currentTokens = profile.tokens || 0;
    const currentlyPrivate = profile.is_private === true;

    if (currentTokens < cost) {
      return Response.json({
        error: `Insufficient tokens. You need ${cost} tokens to toggle your profile privacy.`,
        tokensNeeded: cost - currentTokens,
      }, { status: 402 });
    }

    const newValue = !currentlyPrivate;

    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens: currentTokens - cost,
      is_private: newValue,
    });

    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id: user.id,
      type: 'spend',
      tokens: -cost,
      description: `Profile set to ${newValue ? 'private' : 'public'}`,
    });

    return Response.json({
      success: true,
      is_private: newValue,
      tokensSpent: cost,
      remainingTokens: currentTokens - cost,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});