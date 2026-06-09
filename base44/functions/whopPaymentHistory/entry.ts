import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the member's profile to get their whop_user_id
    const profiles = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const profile = profiles?.[0];
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const whopUserId = profile.whop_user_id;
    if (!whopUserId) {
      return Response.json({ payments: [] });
    }

    // Determine which API key to use based on dev_mode
    const siteConfigs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = siteConfigs?.[0];
    const devMode = config?.dev_mode ?? true;
    const apiKey = devMode
      ? Deno.env.get('WHOP_DEV_API_KEY')
      : Deno.env.get('WHOP_PROD_API_KEY');

    // Fetch payments from Whop API
    const response = await fetch(`https://api.whop.com/api/v2/payments?user_id=${whopUserId}&per=${50}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Whop API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json({ payments: data.data || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});