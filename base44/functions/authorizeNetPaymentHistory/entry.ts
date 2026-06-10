import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get member profile to find their subscription ID
    const profiles = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const profile = profiles?.[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const subscriptionId = profile.paymentnerds_subscription_id;
    if (!subscriptionId) return Response.json({ payments: [] });

    const siteConfigs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = siteConfigs?.[0];
    const useSandbox = config?.dev_mode ?? true;

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');
    const endpoint = useSandbox
      ? 'https://apitest.authorize.net/xml/v1/request.api'
      : 'https://api.authorize.net/xml/v1/request.api';

    // Use getTransactionListRequest filtered by subscription ID
    const body = {
      getTransactionListRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `txlist_${user.id}`,
        searchType: 'subscription',
        id: subscriptionId,
        sorting: {
          orderBy: 'submitTimeUTC',
          orderDescending: true,
        },
        paging: {
          limit: '50',
          offset: '1',
        },
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    const cleanText = rawText.replace(/^\uFEFF/, '');
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch {
      return Response.json({ error: 'Invalid response from Authorize.net' }, { status: 500 });
    }

    const result = data?.getTransactionListResponse ?? data;
    const messages = result?.messages;

    if (messages?.resultCode !== 'Ok') {
      const errMsg = messages?.message?.[0]?.text || 'Failed to fetch transactions.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    const rawTransactions = result?.transactions?.transaction;
    const transactions = rawTransactions
      ? (Array.isArray(rawTransactions) ? rawTransactions : [rawTransactions])
      : [];

    const payments = transactions.map(tx => ({
      id: tx.transId,
      status: tx.transactionStatus,
      amount: parseFloat(tx.settleAmount || tx.authAmount || 0),
      submitted_at: tx.submitTimeUTC,
      account_type: tx.accountType,
      account_number: tx.accountNumber,
      description: tx.transactionType || 'Subscription Payment',
    }));

    return Response.json({ payments });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});