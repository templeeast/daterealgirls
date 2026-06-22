import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Load SiteConfig
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};

    // body.type is the event type in Whop's webhook format
    const eventType = body.type || body.event || body.action;
    // Whop webhook payloads vary by event — log the raw data to diagnose structure
    console.log('whopWebhook raw body.data:', JSON.stringify(body.data));
    // body.data may contain membership, product, or be the object itself
    const membership = body.data?.membership || body.data?.product || body.data;

    console.log('whopWebhook event:', eventType, '| membership id:', membership?.id);

    if (!membership) {
      return Response.json({ error: 'No data in payload' }, { status: 400 });
    }

    const membershipId = body.data?.id || membership.id;

    // Extract metadata — Whop attaches it under checkout_configuration.metadata
    // Log the full raw paths so we can diagnose exactly where it lands
    console.log('membership.checkout_configuration:', JSON.stringify(membership.checkout_configuration));
    console.log('membership.checkout:', JSON.stringify(membership.checkout));
    console.log('membership.metadata:', JSON.stringify(membership.metadata));

    const metadata =
      body.data?.metadata ||
      membership.checkout_configuration?.metadata ||
      membership.checkout?.metadata ||
      membership.metadata ||
      {};

    console.log('resolved metadata:', JSON.stringify(metadata));
    const internalUserId = metadata.internal_member_id;

    let profile = null;

    if (internalUserId) {
      const results = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: internalUserId });
      profile = results[0];
      if (profile) console.log(`Matched profile ${profile.id} via metadata internal_member_id`);
    }

    if (!profile) {
      console.log(`No profile found — membership ${membershipId}, internal_member_id: ${internalUserId}`);
      console.log('Full membership payload:', JSON.stringify(membership));
      return Response.json({ message: 'Profile not found, ignoring' }, { status: 200 });
    }

    const baseUpdate = {};

    const today = new Date().toISOString().split('T')[0];

    if (eventType === 'membership.activated') {
      // Token grants are handled by whopPaymentWebhook on payment.succeeded — nothing to do here
      console.log(`membership.activated received for profile ${profile.id} — token grant handled by payment webhook`);

    } else if (
      eventType === 'membership.went_valid' ||
      eventType === 'membership.renewal' ||
      eventType === 'membership_activated'
    ) {
      const parseEndDate = (expiresAt, renewalPeriodEnd) => {
        if (expiresAt) {
          const d = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
          return d.toISOString().split('T')[0];
        }
        if (renewalPeriodEnd) return new Date(renewalPeriodEnd * 1000).toISOString().split('T')[0];
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      };
      const endDate = parseEndDate(membership.expires_at, membership.renewal_period_end);
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        ...baseUpdate,
        subscription_status: 'active',
        subscription_start_date: today,
        subscription_end_date: endDate,
      });
      console.log(`Activated/renewed subscription for profile ${profile.id}, ends ${endDate}`);

    } else if (
      eventType === 'membership.went_invalid' ||
      eventType === 'membership_deactivated'
    ) {
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        ...baseUpdate,
        subscription_status: 'expired',
        subscription_end_date: today,
      });
      console.log(`Deactivated subscription for profile ${profile.id}`);

    } else if (eventType === 'membership_cancel_at_period_end_changed') {
      if (membership.cancel_at_period_end) {
        const endDate = membership.renewal_period_end
          ? new Date(membership.renewal_period_end * 1000).toISOString().split('T')[0]
          : profile.subscription_end_date;
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
          ...baseUpdate, subscription_status: 'cancelled', subscription_end_date: endDate,
        });
      } else {
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
          ...baseUpdate, subscription_status: 'active',
        });
      }
    } else {
      console.log(`Unhandled Whop event: ${eventType}`);
      if (Object.keys(baseUpdate).length > 0) {
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, baseUpdate);
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('whopWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});