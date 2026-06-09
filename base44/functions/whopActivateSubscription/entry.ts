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

    // Get site config
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs?.[0];
    const devMode = config?.dev_mode ?? true;
    const apiKey = devMode
      ? Deno.env.get('WHOP_DEV_API_KEY')
      : Deno.env.get('WHOP_PROD_API_KEY');
    const planId = config?.whop_men_plan_id;

    // Query Whop v2 memberships — valid=true, optionally filtered by plan
    let searchUrl = `https://api.whop.com/api/v2/memberships?valid=true&per=50`;
    if (planId) searchUrl += `&plan_id=${planId}`;

    const resp = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const respText = await resp.text();
    console.log('Whop memberships status:', resp.status);
    console.log('Whop memberships raw:', respText.slice(0, 500));

    if (!resp.ok) {
      return Response.json({ activated: false, message: `Whop API error: ${respText}` });
    }

    const data = JSON.parse(respText);
    const memberships = data.data || [];
    console.log(`Found ${memberships.length} memberships. User email: ${user.email}`);

    // Log first membership structure to understand shape
    if (memberships.length > 0) {
      console.log('Sample membership keys:', Object.keys(memberships[0]).join(', '));
      console.log('Sample membership:', JSON.stringify(memberships[0]).slice(0, 400));
    }

    const userEmail = user.email?.toLowerCase();

    // Try multiple ways to match the membership to this user
    let membership = memberships.find(m => {
      const mEmail = (m.user?.email || m.email || '').toLowerCase();
      return mEmail === userEmail;
    });

    // Fallback: match by stored whop_user_id
    if (!membership && profile.whop_user_id) {
      membership = memberships.find(m =>
        m.user_id === profile.whop_user_id || m.user?.id === profile.whop_user_id
      );
    }

    if (!membership) {
      return Response.json({ activated: false, message: 'No valid Whop membership found yet.' });
    }

    // Parse end date
    const expiresAt = membership.expires_at || membership.renewal_period_end;
    let endDate;
    if (expiresAt) {
      const d = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
      endDate = d.toISOString().split('T')[0];
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
    });

    console.log(`Activated subscription for profile ${profile.id}, ends ${endDate}`);
    return Response.json({ activated: true, endDate });
  } catch (error) {
    console.error('whopActivateSubscription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});