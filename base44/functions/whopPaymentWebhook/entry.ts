import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Webhook } from 'npm:standardwebhooks@1.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    // Load SiteConfig to determine dev mode
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const isDevMode = config.dev_mode === true;

    const webhookSecret = isDevMode
      ? Deno.env.get('WHOP_DEV_WEBHOOK_SECRET')
      : Deno.env.get('WHOP_PROD_WEBHOOK_SECRET');

    let verified = false;
    if (Deno.env.get('WHOP_SKIP_PAYMENT_WEBHOOK_VERIFICATION') === 'true') {
      verified = false;
    } else if (webhookSecret) {
      try {
        const webhookKey = btoa(webhookSecret);
        const headersObj = {};
        for (const [key, value] of req.headers.entries()) {
          headersObj[key] = value;
        }
        new Webhook(webhookKey).verify(rawBody, headersObj);
        verified = true;
      } catch (err) {
        console.error('Webhook verification failed:', err.message);
        return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const data = event.data;

    console.log('Whop payment webhook event:', eventType);

    if (eventType === 'payment.created') {
      const whopPaymentId = data.id;
      const whopSessionId = data.checkout_id;
      const status = data.status;
      const amountPaid = data.total;
      const currency = data.currency || 'USD';
      const paymentMethod = data.payment_method || 'card';
      const metadata = data.checkout?.metadata || {};

      const userId = metadata.internal_member_id;
      const memberProfileId = metadata.member_profile_id;
      const packName = metadata.pack_name;
      const tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);

      // Idempotency check
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        console.log('Payment already recorded, skipping:', whopPaymentId);
        return Response.json({ received: true });
      }

      await base44.asServiceRole.entities.Payment.create({
        user_id: userId,
        member_profile_id: memberProfileId,
        whop_session_id: whopSessionId,
        whop_payment_id: whopPaymentId,
        token_pack_name: packName,
        tokens_purchased: tokensToGrant,
        amount_paid: amountPaid,
        currency,
        payment_method: paymentMethod,
        payment_status: 'pending',
        webhook_verified: verified,
        raw_event_type: eventType,
      });

      console.log('Created pending Payment record for:', whopPaymentId);

    } else if (eventType === 'payment.succeeded') {
      const whopPaymentId = data.id;
      const whopSessionId = data.checkout_id;
      const amountPaid = data.total;
      const currency = data.currency || 'USD';
      const paymentMethod = data.payment_method || 'card';
      const whopReceiptId = data.receipt_id || null;
      const metadata = data.checkout?.metadata || {};

      const userId = metadata.internal_member_id;
      const memberProfileId = metadata.member_profile_id;
      const packName = metadata.pack_name;

      // Find or create the Payment record
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'succeeded',
          webhook_verified: verified,
          raw_event_type: eventType,
          ...(whopReceiptId ? { whop_receipt_id: whopReceiptId } : {}),
        });
      } else {
        // Determine tokens
        let tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);
        if (!tokensToGrant || tokensToGrant <= 0) {
          const tokenMap = { starter: config.token_pack_starter_tokens || 500, popular: config.token_pack_popular_tokens || 1500, value: config.token_pack_value_tokens || 3500, best: config.token_pack_best_tokens || 8000 };
          tokensToGrant = tokenMap[packName] || 500;
        }
        await base44.asServiceRole.entities.Payment.create({
          user_id: userId,
          member_profile_id: memberProfileId,
          whop_session_id: whopSessionId,
          whop_payment_id: whopPaymentId,
          ...(whopReceiptId ? { whop_receipt_id: whopReceiptId } : {}),
          token_pack_name: packName,
          tokens_purchased: tokensToGrant,
          amount_paid: amountPaid,
          currency,
          payment_method: paymentMethod,
          payment_status: 'succeeded',
          webhook_verified: verified,
          raw_event_type: eventType,
        });
      }

      // Find member profile
      if (!userId) {
        console.log('No user_id in metadata, skipping token grant');
        return Response.json({ received: true });
      }

      const memberProfiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: userId });
      const memberProfile = memberProfiles[0];
      if (!memberProfile) {
        console.log('MemberProfile not found for user_id:', userId);
        return Response.json({ received: true });
      }

      // Determine tokens to grant
      let tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);
      if (!tokensToGrant || tokensToGrant <= 0) {
        const tokenMap = { starter: config.token_pack_starter_tokens || 500, popular: config.token_pack_popular_tokens || 1500, value: config.token_pack_value_tokens || 3500, best: config.token_pack_best_tokens || 8000 };
        const hardcoded = { starter: 500, popular: 1500, value: 3500, best: 8000 };
        tokensToGrant = tokenMap[packName] || hardcoded[packName] || 500;
      }

      const wasFirstPurchase = !memberProfile.has_purchased_tokens;
      const currentTokens = memberProfile.tokens || 0;

      await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
        tokens: currentTokens + tokensToGrant,
        has_purchased_tokens: true,
      });

      await base44.asServiceRole.entities.TokenTransaction.create({
        user_id: userId,
        type: 'purchase',
        tokens: tokensToGrant,
        description: `Whop token pack purchase — ${packName}`,
        amount_paid: amountPaid / 100,
        transaction_id: whopPaymentId,
      });

      console.log(`Granted ${tokensToGrant} tokens to user ${userId} for pack ${packName}`);

      // First purchase bonus
      if (wasFirstPurchase) {
        let bonusTokens = 0;
        if (memberProfile.gender === 'male' && config.first_purchase_bonus_men_enabled) {
          bonusTokens = config.first_purchase_bonus_men_tokens || 0;
        } else if (memberProfile.gender === 'female' && config.first_purchase_bonus_women_enabled) {
          bonusTokens = config.first_purchase_bonus_women_tokens || 0;
        }

        if (bonusTokens > 0) {
          const updatedTokens = (currentTokens + tokensToGrant) + bonusTokens;
          await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
            tokens: updatedTokens,
          });
          await base44.asServiceRole.entities.TokenTransaction.create({
            user_id: userId,
            type: 'bonus',
            tokens: bonusTokens,
            description: `First purchase bonus`,
          });
          console.log(`Granted ${bonusTokens} first-purchase bonus tokens to user ${userId}`);
        }
      }

    } else if (eventType === 'payment.failed') {
      const whopPaymentId = data.id;
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'failed',
          failure_reason: data.failure_reason || 'unknown',
          raw_event_type: eventType,
        });
      }

    } else if (eventType === 'payment.refunded') {
      const whopPaymentId = data.id;
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'refunded',
          raw_event_type: eventType,
        });
      }

    } else {
      console.log('Unhandled event type:', eventType);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});