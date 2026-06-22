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

    // Attempt to create a checkout configuration session.
    let sessionId = null;
    try {
      const checkoutApiBase = isDevMode ? 'https://sandbox-api.whop.com' : 'https://api.whop.com';
      const response = await fetch(`${checkoutApiBase}/api/v2/checkout_configurations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          member_id: memberProfile.user_id,
          email: checkoutEmail,
          hide_email: true,
          metadata,
        }),
      });

      const responseText = await response.text();
      console.log('checkout_configurations response status:', response.status, '| body:', responseText, '| isDevMode:', isDevMode, '| apiBase:', checkoutApiBase);
      if (response.ok) {
        const sessionConfig = JSON.parse(responseText);
        sessionId = sessionConfig.id;
        // Capture whop member_id from response if present so webhook can match directly
        if (sessionConfig.member_id) {
          await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
            whop_member_id: sessionConfig.member_id,
          });
        }
      }
    } catch (e) {
      console.error('checkout_configurations fetch error:', e.message, e.stack);
    }

    // Store the pending pack on the profile so the webhook can look it up
    // even when metadata isn't attached (e.g. when sessionId creation fails)
    await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
      pending_whop_pack: packName,
    });

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