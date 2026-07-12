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

    const enabled = config?.ad_free_enabled !== false;
    if (!enabled) {
      return Response.json({ error: 'Ad-free pass is not available.' }, { status: 403 });
    }

    const cost = config?.ad_free_token_cost ?? 200;
    const days = config?.ad_free_duration_days ?? 7;
    const currentTokens = profile.tokens || 0;

    if (currentTokens < cost) {
      return Response.json({
        error: `Insufficient tokens. You need ${cost} tokens to remove ads.`,
        tokensNeeded: cost - currentTokens,
      }, { status: 402 });
    }

    // If already ad-free, extend from existing expiry; otherwise from now
    const currentExpiry = profile.ad_free_until ? new Date(profile.ad_free_until) : null;
    const base = (currentExpiry && currentExpiry > new Date()) ? currentExpiry : new Date();
    const adFreeUntil = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      tokens: currentTokens - cost,
      ad_free_until: adFreeUntil,
    });

    await base44.asServiceRole.entities.TokenTransaction.create({
      user_id: user.id,
      type: 'spend',
      tokens: -cost,
      description: `Removed ads (${days} days)`,
    });

    return Response.json({
      success: true,
      tokensSpent: cost,
      remainingTokens: currentTokens - cost,
      adFreeUntil,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});