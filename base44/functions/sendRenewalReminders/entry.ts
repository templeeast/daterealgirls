import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find subscriptions expiring in exactly 3 days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const target = targetDate.toISOString().split('T')[0];

    const active = await base44.asServiceRole.entities.MemberProfile.filter({
      subscription_status: 'active',
    });

    const expiringSoon = active.filter(p => p.subscription_end_date === target);
    const isFreeTrialExpiry = (p) => p.free_trial_claimed && p.free_trial_start_date && !p.paymentnerds_subscription_id && !p.stripe_subscription_id;

    // Get site config for site name
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const siteName = configs[0]?.site_name || 'Our Platform';
    const price = configs[0]?.subscription_price || 9.99;

    let count = 0;
    for (const profile of expiringSoon) {
      // Get the user's email
      const users = await base44.asServiceRole.entities.User.filter({ id: profile.user_id });
      const memberUser = users[0];
      if (!memberUser?.email) continue;

      const isTrial = isFreeTrialExpiry(profile);
      const subject = isTrial
        ? `Your free trial on ${siteName} expires in 3 days`
        : `Your ${siteName} subscription expires in 3 days`;
      const body = isTrial
        ? `Hi ${profile.display_name || 'there'},\n\nYour free 1-month trial on ${siteName} expires on ${profile.subscription_end_date}.\n\nWe hope you've enjoyed unlimited browsing and messaging! To keep your Premium access, subscribe for just $${price}/month.\n\nLog in and visit your profile page to subscribe:\nhttps://your-app-url.com/my-profile\n\nThank you for trying ${siteName}!\n\nThe ${siteName} Team`
        : `Hi ${profile.display_name || 'there'},\n\nYour Premium subscription on ${siteName} expires on ${profile.subscription_end_date}.\n\nTo keep enjoying unlimited browsing and messaging, please renew your subscription for just $${price}/month.\n\nLog in and visit your profile page to renew:\nhttps://your-app-url.com/my-profile\n\nThank you for being a member!\n\nThe ${siteName} Team`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: memberUser.email,
        subject,
        body,
      });
      count++;
    }

    return Response.json({ message: `Sent ${count} renewal reminder(s).`, count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});