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

    // Step 1: Look up the Whop user by email to get their whop user ID
    const userEmail = user.email?.toLowerCase();
    let whopUserId = profile.whop_user_id || null;

    if (!whopUserId) {
      // Try to find the whop user by searching memberships with email filter
      const userSearchResp = await fetch(
        `https://api.whop.com/api/v5/users?email=${encodeURIComponent(userEmail)}`,
        { headers: { 'Authorization': `Bearer ${apiKey}` } }
      );
      const userSearchText = await userSearchResp.text();
      console.log('Whop user search status:', userSearchResp.status);
      console.log('Whop user search response:', userSearchText.slice(0, 500));

      if (userSearchResp.ok) {
        const userData = JSON.parse(userSearchText);
        whopUserId = userData?.data?.[0]?.id || userData?.id || null;
        console.log('Found whop user id:', whopUserId);
      }
    }

    // Step 2: Look up memberships
    // If we have a whop user id, search by that; otherwise fall back to listing by plan
    let membership = null;

    if (whopUserId) {
      // Get memberships for this specific user
      let url = `https://api.whop.com/api/v5/memberships?user_id=${whopUserId}&status=active`;
      if (planId) url += `&plan_id=${planId}`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const respText = await resp.text();
      console.log('Membership by user_id status:', resp.status);
      console.log('Membership by user_id response:', respText.slice(0, 600));

      if (resp.ok) {
        const data = JSON.parse(respText);
        const members = data.data || (Array.isArray(data) ? data : []);
        membership = members[0] || null;
      }
    }

    // Fallback: list memberships by plan and try to match
    if (!membership) {
      let url = `https://api.whop.com/api/v5/memberships?status=active&per=50`;
      if (planId) url += `&plan_id=${planId}`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const respText = await resp.text();
      console.log('Fallback membership list status:', resp.status);
      console.log('Fallback membership list response:', respText.slice(0, 800));

      if (resp.ok) {
        const data = JSON.parse(respText);
        const members = data.data || (Array.isArray(data) ? data : []);
        console.log(`Fallback: found ${members.length} memberships`);

        if (members[0]) {
          console.log('First membership structure:', JSON.stringify(members[0]).slice(0, 500));
        }

        // Try matching by email or stored whop_user_id
        membership = members.find(m => {
          const mEmail = (m.user?.email_address || m.user?.email || m.email || '').toLowerCase();
          const mUserId = m.user_id || m.user?.id;
          return mEmail === userEmail || (profile.whop_user_id && mUserId === profile.whop_user_id);
        });
      }
    }

    if (!membership) {
      return Response.json({
        activated: false,
        subscription_status: profile.subscription_status,
        message: 'No active Whop membership found for your account.',
      });
    }

    // Parse end date
    const expiresAt = membership.expires_at || membership.renewal_period_end || membership.valid_until;
    let endDate;
    if (expiresAt) {
      const d = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
      endDate = d.toISOString().split('T')[0];
    } else {
      endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }

    const today = new Date().toISOString().split('T')[0];
    const foundWhopUserId = membership.user_id || membership.user?.id || whopUserId;

    await base44.entities.MemberProfile.update(profile.id, {
      subscription_status: 'active',
      subscription_start_date: today,
      subscription_end_date: endDate,
      ...(foundWhopUserId ? { whop_user_id: foundWhopUserId } : {}),
    });

    console.log(`Activated subscription for profile ${profile.id}, ends ${endDate}`);
    return Response.json({ activated: true, subscription_status: 'active', endDate });
  } catch (error) {
    console.error('whopActivateSubscription error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});