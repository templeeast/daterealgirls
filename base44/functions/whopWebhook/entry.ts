import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Webhook } from 'npm:standardwebhooks@1.0.0';
import { settleVerificationFee } from '../../shared/verificationFee.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rawBody = await req.text();

    // Load SiteConfig
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0] || {};
    const isDevMode = config.dev_mode === true;

    // Signature verification
    const webhookSecret = isDevMode
      ? Deno.env.get('WHOP_DEV_WEBHOOK_SECRET')
      : Deno.env.get('WHOP_PROD_WEBHOOK_SECRET');

    let verified = false;
    if (webhookSecret) {
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

    if (!verified) {
      return Response.json({ error: 'Webhook signature required' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventType = body.type || body.event || body.action;
    const data = body.data;

    console.log('whopWebhook event:', eventType);
    console.log('whopWebhook raw data:', JSON.stringify(data));

    // ─── PAYMENT EVENTS ───────────────────────────────────────────────────────

    if (eventType === 'payment.created') {
      const whopPaymentId = data.id;
      const metadata = data.checkout?.metadata || data.metadata || {};
      const userId = metadata.internal_member_id;
      const memberProfileId = metadata.member_profile_id;
      const packName = metadata.pack_name;
      const tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);

      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        console.log('Payment already recorded, skipping:', whopPaymentId);
        return Response.json({ received: true });
      }

      await base44.asServiceRole.entities.Payment.create({
        user_id: userId,
        member_profile_id: memberProfileId,
        whop_session_id: data.checkout_id,
        whop_payment_id: whopPaymentId,
        token_pack_name: packName,
        tokens_purchased: tokensToGrant,
        amount_paid: data.total,
        currency: data.currency || 'USD',
        payment_method: data.payment_method || 'card',
        payment_status: 'pending',
        webhook_verified: verified,
        raw_event_type: eventType,
      });
      console.log('Created pending Payment record for:', whopPaymentId);

    } else if (eventType === 'payment.succeeded') {
      const whopPaymentId = data.id;
      const whopReceiptId = data.receipt_id || null;
      const metadata = data.checkout?.metadata || data.metadata || {};
      const userId = metadata.internal_member_id;
      const memberProfileId = metadata.member_profile_id;
      const packName = metadata.pack_name;

      // Upsert Payment record
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: whopPaymentId });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'succeeded',
          webhook_verified: verified,
          raw_event_type: eventType,
          ...(whopReceiptId ? { whop_receipt_id: whopReceiptId } : {}),
        });
      } else {
        let tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);
        if (!tokensToGrant) {
          const tokenMap = { starter: config.token_pack_starter_tokens || 500, popular: config.token_pack_popular_tokens || 1500, value: config.token_pack_value_tokens || 3500, best: config.token_pack_best_tokens || 8000 };
          tokensToGrant = tokenMap[packName] || 500;
        }
        await base44.asServiceRole.entities.Payment.create({
          user_id: userId,
          member_profile_id: memberProfileId,
          whop_session_id: data.checkout_id,
          whop_payment_id: whopPaymentId,
          ...(whopReceiptId ? { whop_receipt_id: whopReceiptId } : {}),
          token_pack_name: packName,
          tokens_purchased: tokensToGrant,
          amount_paid: data.total,
          currency: data.currency || 'USD',
          payment_method: data.payment_method || 'card',
          payment_status: 'succeeded',
          webhook_verified: verified,
          raw_event_type: eventType,
        });
      }

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

      let tokensToGrant = parseInt(metadata.tokens_to_grant || '0', 10);
      if (!tokensToGrant) {
        const tokenMap = { starter: config.token_pack_starter_tokens || 500, popular: config.token_pack_popular_tokens || 1500, value: config.token_pack_value_tokens || 3500, best: config.token_pack_best_tokens || 8000 };
        tokensToGrant = tokenMap[packName] || 500;
      }

      const wasFirstPurchase = !memberProfile.has_purchased_tokens;
      const currentTokens = memberProfile.tokens || 0;

      // Check for pending purchase-type promos to apply on first purchase
      let pendingPromoTokens = 0;
      if (wasFirstPurchase) {
        const usedCodes = memberProfile.used_promo_codes || [];
        for (const codeName of usedCodes) {
          const promos = await base44.asServiceRole.entities.PromoCode.filter({ code: codeName, is_active: true });
          if (promos.length > 0) {
            const promo = promos[0];
            if (promo.type === 'purchase') {
              pendingPromoTokens += promo.tokens || 0;
            }
          }
        }
      }

      await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
        tokens: currentTokens + tokensToGrant + pendingPromoTokens,
        has_purchased_tokens: true,
      });

      await base44.asServiceRole.entities.TokenTransaction.create({
        user_id: userId,
        type: 'purchase',
        tokens: tokensToGrant + pendingPromoTokens,
        description: `Whop token pack purchase — ${packName}` + (pendingPromoTokens > 0 ? ` + ${pendingPromoTokens} pending promo tokens` : ''),
        amount_paid: data.total || 0,
        transaction_id: whopPaymentId,
      });

      console.log(`Granted ${tokensToGrant} tokens to user ${userId} for pack ${packName}`);

      // Settle any owed ID verification fee from the granted tokens
      await settleVerificationFee(base44, memberProfile, config);

      // First purchase bonus disabled — admin awards bonuses manually

    } else if (eventType === 'payment.failed') {
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: data.id });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'failed',
          failure_reason: data.failure_reason || 'unknown',
          raw_event_type: eventType,
        });
      }

    } else if (eventType === 'payment.refunded') {
      const existing = await base44.asServiceRole.entities.Payment.filter({ whop_payment_id: data.id });
      if (existing.length > 0) {
        await base44.asServiceRole.entities.Payment.update(existing[0].id, {
          payment_status: 'refunded',
          raw_event_type: eventType,
        });
      }

    } else {
      console.log('Unhandled Whop event:', eventType);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('whopWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});