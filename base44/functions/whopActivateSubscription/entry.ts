import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the member's profile
    const profiles = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const profile = profiles?.[0];
    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get site config for dev mode and plan ID
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs?.[0];
    const devMode = config?.dev_mode ?? true;
    const apiKey = devMode
      ? Deno.env.get('WHOP_DEV_API_KEY')
      : Deno.env.get('WHOP_PROD_API_KEY');
    const planId = config?.whop_men_plan_id;

    // Look up the user's memberships on Whop by email
    const userEmail = user.email;
    const searchUrl = `https://api.whop.com/api/v2/memberships?valid=true&page=1&per=10${planId ? `&plan_id=${planId}` : ''}`;

    const resp = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return Response.json({ error: `Whop API error: ${errText}` }, { status: resp.status });
    }

    const data = await resp.json();
    const memberships = data.data || [];

    // Find a valid membership matching this user's email
    const membership = memberships.find(m => m.user?.email === userEmail || m.user_email === userEmail);

    if (!membership) {
      return Response.json({ activated: false, message: 'No valid Whop membership found for this account yet.' });
    }

    // Parse end date
    const expiresAt = membership.expires_at;
    let endDate;
    if (expiresAt) {
      const d = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
      endDate = d.toISOString().split('T')[0];
    } else if (membership.renewal_period_end) {
      endDate = new Date(membership.renewal_period_end * 1000).toISOString().split('T')[0];
    } else {
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const today = new Date().toISOString().split('T')[0];
    const whopUserId = membership.user_id || membership.user?.id;

    await base44.entities.MemberProfile.update(profile.id, {
      subscription_status: 'active',
      subscription_start_date: today,
      subscription_end_date: endDate,
      ...(whopUserId ? { whop_user_id: whopUserId } : {}),
      ...(membership.id ? { whop_membership_id: membership.id } : {}),
    });

    console.log(`Activated subscription for profile ${profile.id}, ends ${endDate}`);
    return Response.json({ activated: true, endDate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});