import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Webhook } from 'npm:standardwebhooks@1.0.0';

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

      await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
        tokens: currentTokens + tokensToGrant,
        has_purchased_tokens: true,
      });

      await base44.asServiceRole.entities.TokenTransaction.create({
        user_id: userId,
        type: 'purchase',
        tokens: tokensToGrant,
        description: `Whop token pack purchase — ${packName}`,
        amount_paid: data.total || 0,
        transaction_id: whopPaymentId,
      });

      console.log(`Granted ${tokensToGrant} tokens to user ${userId} for pack ${packName}`);

      if (wasFirstPurchase) {
        let bonusTokens = 0;
        if (memberProfile.gender === 'male' && config.first_purchase_bonus_men_enabled) {
          bonusTokens = config.first_purchase_bonus_men_tokens || 0;
        } else if (memberProfile.gender === 'female' && config.first_purchase_bonus_women_enabled) {
          bonusTokens = config.first_purchase_bonus_women_tokens || 0;
        }
        if (bonusTokens > 0) {
          await base44.asServiceRole.entities.MemberProfile.update(memberProfile.id, {
            tokens: (currentTokens + tokensToGrant) + bonusTokens,
          });
          await base44.asServiceRole.entities.TokenTransaction.create({
            user_id: userId,
            type: 'bonus',
            tokens: bonusTokens,
            description: 'First purchase bonus',
          });
          console.log(`Granted ${bonusTokens} first-purchase bonus tokens to user ${userId}`);
        }
      }

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

    // ─── MEMBERSHIP EVENTS ────────────────────────────────────────────────────

    } else if (eventType === 'membership.activated') {
      console.log('membership.activated — token grant handled by payment.succeeded');

    } else if (
      eventType === 'membership.went_valid' ||
      eventType === 'membership.renewal' ||
      eventType === 'membership_activated'
    ) {
      // Resolve profile from metadata
      const membership = data?.membership || data;
      const metadata = data?.metadata || membership?.metadata || {};
      const userId = metadata.internal_member_id;
      if (!userId) { console.log('No user_id in membership event'); return Response.json({ received: true }); }
      const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: userId });
      const profile = profiles[0];
      if (!profile) { console.log('Profile not found for userId:', userId); return Response.json({ received: true }); }

      const parseEndDate = (expiresAt, renewalPeriodEnd) => {
        if (expiresAt) {
          const d = typeof expiresAt === 'number' ? new Date(expiresAt * 1000) : new Date(expiresAt);
          return d.toISOString().split('T')[0];
        }
        if (renewalPeriodEnd) return new Date(renewalPeriodEnd * 1000).toISOString().split('T')[0];
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      };
      const today = new Date().toISOString().split('T')[0];
      const endDate = parseEndDate(membership.expires_at, membership.renewal_period_end);
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'active',
        subscription_start_date: today,
        subscription_end_date: endDate,
      });
      console.log(`Activated/renewed subscription for profile ${profile.id}, ends ${endDate}`);

    } else if (
      eventType === 'membership.went_invalid' ||
      eventType === 'membership_deactivated'
    ) {
      const metadata = data?.metadata || {};
      const userId = metadata.internal_member_id;
      if (!userId) { console.log('No user_id in membership event'); return Response.json({ received: true }); }
      const profiles = await base44.asServiceRole.entities.MemberProfile.filter({ user_id: userId });
      const profile = profiles[0];
      if (profile) {
        const today = new Date().toISOString().split('T')[0];
        await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
          subscription_status: 'expired',
          subscription_end_date: today,
        });
        console.log(`Deactivated subscription for profile ${profile.id}`);
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