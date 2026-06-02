import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cardNumber, cardExpiry, cardCvv, amount, useSandbox } = await req.json();

    if (!cardNumber || !cardExpiry || !cardCvv || !amount) {
      return Response.json({ error: 'Missing required payment fields.' }, { status: 400 });
    }

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');

    const endpoint = useSandbox
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    // Parse MM/YY expiry → YYYY-MM
    const [expMonth, expYear] = cardExpiry.split('/').map(s => s.trim());
    const expirationDate = `20${expYear}-${expMonth}`;

    // Start date: tomorrow (ARB processes at 2am PST, so today = next day)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const body = {
      ARBCreateSubscriptionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `arb_${user.id}_${Date.now()}`,
        subscription: {
          name: 'Premium Monthly Subscription',
          paymentSchedule: {
            interval: {
              length: '1',
              unit: 'months',
            },
            startDate: startDateStr,
            totalOccurrences: '9999', // indefinite
            trialOccurrences: '1',
          },
          amount: String(Number(amount).toFixed(2)),
          trialAmount: '0.00',
          payment: {
            creditCard: {
              cardNumber: cardNumber.replace(/\s/g, ''),
              expirationDate: expirationDate,
              // cardCode intentionally omitted — PCI-DSS prohibits storing CVV for recurring
            },
          },
          customer: {
            email: user.email,
          },
          billTo: {
            firstName: (user.full_name || '').split(' ')[0] || 'Customer',
            lastName: (user.full_name || '').split(' ').slice(1).join(' ') || 'Member',
          },
        },
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const messages = data?.ARBCreateSubscriptionResponse?.messages;

    if (messages?.resultCode === 'Error') {
      const errMsg = messages?.message?.[0]?.text || 'Subscription creation failed.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    const subscriptionId = data?.ARBCreateSubscriptionResponse?.subscriptionId;
    if (!subscriptionId) {
      return Response.json({ error: 'No subscription ID returned from Authorize.net.' }, { status: 400 });
    }

    // Update MemberProfile with active subscription (first month is free trial via ARB)
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      const today = new Date();
      const trialEndDate = new Date(today);
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'active',
        subscription_start_date: today.toISOString().split('T')[0],
        subscription_end_date: trialEndDate.toISOString().split('T')[0],
        free_trial_claimed: true,
        free_trial_start_date: today.toISOString().split('T')[0],
        paymentnerds_subscription_id: subscriptionId,
      });
    }

    return Response.json({ success: true, subscriptionId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});