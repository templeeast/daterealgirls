import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();

  // Determine dev_mode from SiteConfig to pick the right webhook secret
  const configs = await base44.asServiceRole.entities.SiteConfig.list();
  const isDevMode = configs[0]?.dev_mode === true;
  const webhookSecret = isDevMode
    ? Deno.env.get('WHOP_DEV_WEBHOOK_SECRET')
    : Deno.env.get('WHOP_PROD_WEBHOOK_SECRET');

  // Verify webhook secret
  if (webhookSecret) {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== webhookSecret) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Support both old action-based format and new event-based format
  const action = body.action;
  const event = body.event;

  // New format: body.event + body.data.membership
  // Old format: body.action + body.data (membership object directly)
  const membership = body.data?.membership || body.data;

  if (!membership) {
    return Response.json({ error: 'No data in payload' }, { status: 400 });
  }

  // Extract identifiers
  const whopUserId = membership.user_id || membership.user?.id;
  const membershipId = membership.id;
  const memberEmail = membership.user?.email;

  // Find profile: try whop_user_id first, then whop_membership_id, then email
  let profile = null;

  if (whopUserId) {
    const results = await base44.asServiceRole.entities.MemberProfile.filter({ whop_user_id: whopUserId });
    profile = results[0];
  }

  if (!profile && membershipId) {
    const results = await base44.asServiceRole.entities.MemberProfile.filter({ whop_membership_id: membershipId });
    profile = results[0];
  }

  if (!profile && memberEmail) {
    const users = await base44.asServiceRole.entities.User.filter({ email: memberEmail });
    if (users[0]) {
      const byUser = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: users[0].id });
      profile = byUser[0];
    }
  }

  if (!profile) {
    console.log(`No profile found for membership ${membershipId}, user ${whopUserId}, email ${memberEmail}`);
    return Response.json({ message: 'Profile not found, ignoring' }, { status: 200 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Normalize event type (support both formats)
  const normalizedEvent = event || action;

  // Helper to parse end date
  const parseEndDate = (expiresAt, renewalPeriodEnd) => {
    if (expiresAt) {
      // Could be ISO string or unix timestamp
      const d = typeof expiresAt === 'number'
        ? new Date(expiresAt * 1000)
        : new Date(expiresAt);
      return d.toISOString().split('T')[0];
    }
    if (renewalPeriodEnd) {
      return new Date(renewalPeriodEnd * 1000).toISOString().split('T')[0];
    }
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  };

  const baseUpdate = {};
  if (membershipId) baseUpdate.whop_membership_id = membershipId;
  if (whopUserId) baseUpdate.whop_user_id = whopUserId;

  if (
    normalizedEvent === 'membership.went_valid' ||
    normalizedEvent === 'membership.renewal' ||
    normalizedEvent === 'membership_activated'
  ) {
    const endDate = parseEndDate(membership.expires_at, membership.renewal_period_end);
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      ...baseUpdate,
      subscription_status: 'active',
      subscription_start_date: today,
      subscription_end_date: endDate,
    });
    console.log(`Activated/renewed subscription for profile ${profile.id}, ends ${endDate}`);

  } else if (
    normalizedEvent === 'membership.went_invalid' ||
    normalizedEvent === 'membership_deactivated'
  ) {
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      ...baseUpdate,
      subscription_status: 'expired',
      subscription_end_date: today,
    });
    console.log(`Deactivated subscription for profile ${profile.id}`);

  } else if (normalizedEvent === 'membership_cancel_at_period_end_changed') {
    const cancelAtPeriodEnd = membership.cancel_at_period_end;
    if (cancelAtPeriodEnd) {
      const endDate = membership.renewal_period_end
        ? new Date(membership.renewal_period_end * 1000).toISOString().split('T')[0]
        : profile.subscription_end_date;
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        ...baseUpdate,
        subscription_status: 'cancelled',
        subscription_end_date: endDate,
      });
      console.log(`Marked subscription cancelled (access until ${endDate}) for profile ${profile.id}`);
    } else {
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        ...baseUpdate,
        subscription_status: 'active',
      });
      console.log(`Reinstated active subscription for profile ${profile.id}`);
    }
  } else {
    console.log(`Unhandled Whop event: ${normalizedEvent}`);
  }

  return Response.json({ success: true });
});