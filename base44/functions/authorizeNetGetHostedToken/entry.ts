import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const USE_SANDBOX = true; // Toggle to false for production

const API_URL = USE_SANDBOX
  ? 'https://apitest.authorize.net/xml/v1/request.api'
  : 'https://api.authorize.net/xml/v1/request.api';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, returnUrl, cancelUrl } = await req.json();

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');

    const payload = {
      getHostedPaymentPageRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: String(Number(amount).toFixed(2)),
        },
        hostedPaymentSettings: {
          setting: [
            {
              settingName: 'hostedPaymentReturnOptions',
              settingValue: JSON.stringify({
                showReceipt: true,
                url: returnUrl || 'https://mysite.com/my-profile',
                urlText: 'Return to Profile',
                cancelUrl: cancelUrl || 'https://mysite.com/my-profile',
                cancelUrlText: 'Cancel',
              }),
            },
            {
              settingName: 'hostedPaymentButtonOptions',
              settingValue: JSON.stringify({ text: 'Pay Now' }),
            },
            {
              settingName: 'hostedPaymentPaymentOptions',
              settingValue: JSON.stringify({
                cardCodeRequired: true,
                showCreditCard: true,
                showBankAccount: false,
              }),
            },
            {
              settingName: 'hostedPaymentBillingAddressOptions',
              settingValue: JSON.stringify({ show: true, required: false }),
            },
            {
              settingName: 'hostedPaymentShippingAddressOptions',
              settingValue: JSON.stringify({ show: false, required: false }),
            },
            {
              settingName: 'hostedPaymentSecurityOptions',
              settingValue: JSON.stringify({ captcha: false }),
            },
            {
              settingName: 'hostedPaymentIFrameCommunicatorUrl',
              settingValue: JSON.stringify({ url: `${returnUrl ? new URL(returnUrl).origin : ''}/iframeCommunicator` }),
            },
          ],
        },
      },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    // Strip BOM if present
    const clean = text.replace(/^\uFEFF/, '');
    const data = JSON.parse(clean);

    if (data.messages?.resultCode === 'Error') {
      const msg = data.messages?.message?.[0]?.text || 'Failed to get hosted token';
      return Response.json({ error: msg }, { status: 400 });
    }

    return Response.json({ token: data.token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});