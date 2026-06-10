import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Scheduled function: checks ARB subscription statuses and syncs them to MemberProfile.
 * For ARB-managed subscriptions, Authorize.net handles billing automatically.
 * This function syncs status and extends subscription_end_date on active ARB subs.
 * It also expires non-ARB (manual one-time) subscriptions by date.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');

    // Get site config to determine sandbox mode
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0];
    const useSandbox = !config || config.payment_processor !== 'authorizenet'; // default safe

    const endpoint = useSandbox
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    const today = new Date().toISOString().split('T')[0];

    // Get all active profiles
    const activeProfiles = await base44.asServiceRole.entities.MemberProfile.filter({
      subscription_status: 'active',
    });

    let renewed = 0;
    let expired = 0;

    for (const profile of activeProfiles) {
      const arbSubId = profile.paymentnerds_subscription_id;

      if (arbSubId) {
        // ARB-managed subscription — check status with Authorize.net
        const statusReq = {
          ARBGetSubscriptionStatusRequest: {
            merchantAuthentication: { name: apiLoginId, transactionKey },
            subscriptionId: arbSubId,
          },
        };

        const statusRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(statusReq),
        });
        const statusData = await statusRes.json();
        const arbStatus = statusData?.ARBGetSubscriptionStatusResponse?.status;
        const resultCode = statusData?.ARBGetSubscriptionStatusResponse?.messages?.resultCode;

        if (resultCode === 'Ok' && arbStatus) {
          if (arbStatus === 'active') {
            // Subscription is active — always sync end date to 1 month from today
            const newEnd = new Date();
            newEnd.setMonth(newEnd.getMonth() + 1);
            await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
              subscription_status: 'active',
              subscription_end_date: newEnd.toISOString().split('T')[0],
            });
            renewed++;
          } else if (arbStatus === 'canceled' || arbStatus === 'terminated' || arbStatus === 'expired') {
            await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
              subscription_status: arbStatus === 'canceled' ? 'cancelled' : 'expired',
              paymentnerds_subscription_id: null,
            });
            expired++;
          } else if (arbStatus === 'suspended') {
            // Leave as active in our DB but note: Authorize.net will terminate if not fixed
          }
        }
      } else {
        // Manual / non-ARB subscription — expire by date
        if (profile.subscription_end_date && profile.subscription_end_date < today) {
          await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
            subscription_status: 'expired',
          });
          expired++;
        }
      }
    }

    return Response.json({ message: `Renewed ${renewed}, expired ${expired} subscription(s).`, renewed, expired });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});