import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Whop sends a secret in the Authorization header as "Bearer <WHOP_WEBHOOK_SECRET>"
// We verify it to ensure requests are genuinely from Whop.
const WHOP_WEBHOOK_SECRET = Deno.env.get('WHOP_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  // Verify webhook secret if configured
  if (WHOP_WEBHOOK_SECRET) {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token !== WHOP_WEBHOOK_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = await req.json();
  const action = body.action;
  const membership = body.data;

  if (!membership) {
    return Response.json({ error: 'No data in payload' }, { status: 400 });
  }

  // Extract the whop_user_id from the membership object
  const whopUserId = membership.user_id || membership.user?.id;

  if (!whopUserId) {
    return Response.json({ error: 'No user_id in membership payload' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Find the member profile by whop_user_id
  const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ whop_user_id: whopUserId });
  let profile = profiles[0];

  // If not found by whop_user_id, try matching by email
  if (!profile && membership.user?.email) {
    const users = await base44.asServiceRole.entities.User.filter({ email: membership.user.email });
    if (users[0]) {
      const byUser = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: users[0].id });
      profile = byUser[0];
    }
  }

  if (!profile) {
    console.log(`No profile found for whop_user_id=${whopUserId}`);
    return Response.json({ message: 'Profile not found, ignoring' }, { status: 200 });
  }

  const today = new Date().toISOString().split('T')[0];

  if (action === 'membership_activated') {
    // Calculate subscription end date (30 days from now, or use renewal_period_end if provided)
    const endDate = membership.renewal_period_end
      ? new Date(membership.renewal_period_end * 1000).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      subscription_status: 'active',
      subscription_start_date: today,
      subscription_end_date: endDate,
      whop_user_id: whopUserId,
    });
    console.log(`Activated subscription for profile ${profile.id}`);

  } else if (action === 'membership_deactivated') {
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      subscription_status: 'expired',
      subscription_end_date: today,
    });
    console.log(`Deactivated subscription for profile ${profile.id}`);

  } else if (action === 'membership_cancel_at_period_end_changed') {
    // User cancelled but retains access until period end
    const cancelAtPeriodEnd = membership.cancel_at_period_end;
    if (cancelAtPeriodEnd) {
      const endDate = membership.renewal_period_end
        ? new Date(membership.renewal_period_end * 1000).toISOString().split('T')[0]
        : profile.subscription_end_date;

      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'cancelled',
        subscription_end_date: endDate,
      });
      console.log(`Marked subscription as cancelled (access until ${endDate}) for profile ${profile.id}`);
    } else {
      // cancel_at_period_end was reversed (user re-subscribed)
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'active',
      });
      console.log(`Reinstated active subscription for profile ${profile.id}`);
    }
  } else {
    console.log(`Unhandled Whop event: ${action}`);
  }

  return Response.json({ success: true });
});