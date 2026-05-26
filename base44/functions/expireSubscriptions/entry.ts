import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Find all active subscriptions that have expired
    const expired = await base44.asServiceRole.entities.MemberProfile.filter({
      subscription_status: 'active',
    });

    const toExpire = expired.filter(p => p.subscription_end_date && p.subscription_end_date < today);

    let count = 0;
    for (const profile of toExpire) {
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
        subscription_status: 'expired',
      });
      count++;
    }

    return Response.json({ message: `Expired ${count} subscription(s).`, count });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});