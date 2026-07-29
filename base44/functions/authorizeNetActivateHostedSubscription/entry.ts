import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { transId, useSandbox } = await req.json();
    if (!transId) return Response.json({ error: 'transId required' }, { status: 400 });

    // Read subscription price from SiteConfig — verify amount server-side
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const subscriptionPrice = Number(config.subscription_price ?? 5);

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');
    const endpoint = useSandbox
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    // Verify the transaction with Authorize.net (server-to-server)
    const verifyBody = {
      getTransactionDetailsRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        transId: transId,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyBody),
    });

    const data = await response.json();
    const tx = data?.transaction;
    const messages = data?.messages;

    if (!messages || messages?.resultCode !== 'Ok') {
      const errMsg = messages?.message?.[0]?.text || 'Transaction verification failed.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    // Check that the transaction was approved
    if (tx?.responseCode !== '1') {
      return Response.json({ error: 'Transaction was not approved.' }, { status: 400 });
    }

    // Verify the amount matches the server-side subscription price
    const txAmount = Number(tx?.authAmount ?? 0);
    if (Math.abs(txAmount - subscriptionPrice) > 0.01) {
      return Response.json({ error: 'Transaction amount does not match the expected subscription price.' }, { status: 400 });
    }

    // Update the member's subscription status
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'active',
        subscription_start_date: startDate.toISOString().split('T')[0],
        subscription_end_date: endDate.toISOString().split('T')[0],
        paymentnerds_subscription_id: transId,
      });
    }

    return Response.json({ success: true, transactionId: transId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});