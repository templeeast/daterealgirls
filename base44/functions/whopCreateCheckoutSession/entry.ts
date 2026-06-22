import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { packName } = await req.json();
    if (!packName) return Response.json({ error: 'packName is required' }, { status: 400 });

    // Load member profile
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    const memberProfile = profiles[0];
    if (!memberProfile) return Response.json({ error: 'Member profile not found' }, { status: 404 });

    // Load site config
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};

    const isDevMode = config.dev_mode === true;
    const checkoutEmail = config.whop_checkout_email || '';

    // Get pack-specific plan ID and token count
    const planIdMap = {
      starter: config.whop_plan_starter,
      popular: config.whop_plan_popular,
      value:   config.whop_plan_value,
      best:    config.whop_plan_best,
    };
    const tokenCountMap = {
      starter: config.token_pack_starter_tokens || 500,
      popular: config.token_pack_popular_tokens || 1500,
      value:   config.token_pack_value_tokens   || 3500,
      best:    config.token_pack_best_tokens    || 8000,
    };

    const planId = planIdMap[packName];
    if (!planId) return Response.json({ error: `Plan ID not configured for pack: ${packName}` }, { status: 400 });

    const tokensToGrant = tokenCountMap[packName] || 500;
    const apiBase = (config.whop_api_base_url || '').trim() || 'https://api.whop.com';
    const apiKey = isDevMode ? Deno.env.get('WHOP_DEV_API_KEY') : Deno.env.get('WHOP_PROD_API_KEY');

    const metadata = {
      internal_member_id: memberProfile.user_id,
      member_profile_id:  memberProfile.id,
      pack_name:          packName,
      tokens_to_grant:    String(tokensToGrant),
    };

    // Attempt to create a checkout configuration session (requires checkout_configurations permission on API key).
    // If it fails, fall back to returning planId so the frontend can build a direct checkout URL.
    let sessionId = null;
    try {
      const response = await fetch(`${apiBase}/api/v2/checkout_configurations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_id: planId, metadata }),
      });

      if (response.ok) {
        const sessionConfig = await response.json();
        sessionId = sessionConfig.id;
      } else {
        const errText = await response.text();
        const maskedKey = apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'NOT SET';
      console.warn('checkout_configurations failed, falling back to planId. Status:', response.status, errText, '| isDevMode:', isDevMode, '| apiKey:', maskedKey);
      }
    } catch (e) {
      console.warn('checkout_configurations request error, falling back to planId:', e.message);
    }

    return Response.json({
      sessionId,
      planId,
      checkoutEmail,
      tokensToGrant,
      metadata,
      isDevMode,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});