import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { cardNumber, cardExpiry, cardCvv, amount, packName, tokensToAdd } = await req.json();

    if (!cardNumber || !cardExpiry || !cardCvv || !amount) {
      return Response.json({ error: 'Missing required payment fields.' }, { status: 400 });
    }

    const apiLoginId = Deno.env.get('AUTHORIZENET_API_LOGIN_ID');
    const transactionKey = Deno.env.get('AUTHORIZENET_TRANSACTION_KEY');

    const endpoint = 'https://apitest.authorize.net/xml/v1/request.api';

    const [expMonth, expYear] = cardExpiry.split('/').map(s => s.trim());
    const expirationDate = `20${expYear}-${expMonth}`;

    const body = {
      createTransactionRequest: {
        merchantAuthentication: {
          name: apiLoginId,
          transactionKey: transactionKey,
        },
        refId: `tokens_${user.id}_${Date.now()}`,
        transactionRequest: {
          transactionType: 'authCaptureTransaction',
          amount: String(Number(amount).toFixed(2)),
          payment: {
            creditCard: {
              cardNumber: cardNumber.replace(/\s/g, ''),
              expirationDate: expirationDate,
              cardCode: cardCvv,
            },
          },
          order: {
            description: `Token Purchase — ${packName} (${tokensToAdd} tokens)`,
          },
          customer: {
            email: user.email,
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
    const txResponse = data?.transactionResponse;
    const messages = data?.messages;

    if (messages?.resultCode === 'Error') {
      const errMsg = messages?.message?.[0]?.text || 'Transaction failed.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    if (txResponse?.responseCode !== '1') {
      const errMsg = txResponse?.errors?.[0]?.errorText || txResponse?.messages?.[0]?.description || 'Transaction declined.';
      return Response.json({ error: errMsg }, { status: 400 });
    }

    // Credit tokens to the user's profile
    const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: user.id });
    if (profiles.length > 0) {
      const profile = profiles[0];
      const isFirstPurchase = !profile.has_purchased_tokens;

      // Fetch site config to check first-purchase bonus settings (gender-specific)
      const configs = await base44.asServiceRole.entities.SiteConfig.list();
      const siteConfig = configs[0] || {};

      const isMale = profile.gender === 'male';
      let bonusEnabled, bonusTokens;
      if (isMale) {
        bonusEnabled = siteConfig.first_purchase_bonus_men_enabled !== false;
        bonusTokens = siteConfig.first_purchase_bonus_men_tokens ?? siteConfig.first_purchase_bonus_tokens ?? 5000;
      } else {
        bonusEnabled = siteConfig.first_purchase_bonus_women_enabled === true;
        bonusTokens = siteConfig.first_purchase_bonus_women_tokens ?? 0;
      }

      const bonusToApply = (isFirstPurchase && bonusEnabled) ? bonusTokens : 0;
      const totalTokens = (profile.tokens || 0) + tokensToAdd + bonusToApply;

      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        tokens: totalTokens,
        has_purchased_tokens: true,
      });

      return Response.json({
        success: true,
        transactionId: txResponse.transId,
        tokensAdded: tokensToAdd,
        bonusTokens: bonusToApply,
        isFirstPurchase,
      });
    }

    return Response.json({
      success: true,
      transactionId: txResponse.transId,
      tokensAdded: tokensToAdd,
      bonusTokens: 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});