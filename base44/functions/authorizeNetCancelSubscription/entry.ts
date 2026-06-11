import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { useSandbox } = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');

    const endpoint = useSandbox
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    // Get the profile and ARB subscription ID
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found.' }, { status: 404 });
    }

    const profile = profiles[0];
    const subscriptionId = profile.subscription_id || profile.paymentnerds_subscription_id;

    // Free trial users have no ARB subscription — just cancel locally
    if (!subscriptionId) {
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'cancelled',
        free_trial_claimed: true,
      });
      return Response.json({ success: true });
    }

    const body = {
      ARBCancelSubscriptionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `cancel_${user.id}_${Date.now()}`,
        subscriptionId: subscriptionId,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const messages = data?.ARBCancelSubscriptionResponse?.messages;

    if (messages?.resultCode === 'Error') {
      const errMsg = messages?.message?.[0]?.text || 'Cancellation failed.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    // Mark subscription as cancelled in our DB
    await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
      subscription_status: 'cancelled',
      subscription_id: null,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});