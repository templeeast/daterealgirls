import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { country, currency, itemName, useSandbox } = await req.json();

    // Read subscription price from SiteConfig — never trust client-supplied price
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const subscriptionPrice = Number(config.subscription_price ?? 5);

    const apiKey = useSandbox
      ? Deno.env.get('CODAPAY_SANDBOX_API_KEY')
      : Deno.env.get('CODAPAY_PRODUCTION_API_KEY');
    const projectId = Deno.env.get('CODAPAY_PROJECT_ID');

    const baseUrl = useSandbox
      ? 'https://sandbox.codapayments.com/airtime/api/restful/v2.0/Payment'
      : 'https://airtime.codapayments.com/airtime/api/restful/v2.0/Payment';

    const orderId = `sub_${user.id}_${Date.now()}`;

    const body = {
      initRequest: {
        country: country,
        payType: 0, // channel selection page
        apiKey: apiKey,
        projectId: String(projectId),
        orderId: orderId,
        currency: currency,
        items: [
          {
            price: subscriptionPrice,
            name: itemName || 'Premium Subscription',
          }
        ],
        profile: {
          entry: [
            { key: 'user_id', value: user.id },
            { key: 'email', value: user.email },
            { key: 'return_url', value: `${req.headers.get('origin') || ''}/my-profile?codapay_txn={transactionId}&order_id={orderId}` },
          ]
        }
      }
    };

    const response = await fetch(`${baseUrl}/init.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.initResult?.resultCode !== 0) {
      return Response.json({ error: data.initResult?.resultDesc || 'Payment initiation failed' }, { status: 400 });
    }

    return Response.json({
      txnId: data.initResult.txnId,
      redirectUrl: data.initResult.redirectUrl,
      orderId: orderId,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});