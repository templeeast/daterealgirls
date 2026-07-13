import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch site config for wink expiry hours
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0];
    const expiryHours = config?.wink_expiry_hours ?? 168;

    // 0 = never expire
    if (!expiryHours || expiryHours <= 0) {
      return Response.json({ success: true, expiry_hours: expiryHours, deleted: 0, skipped: true });
    }

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - expiryHours);

    let deleted = 0;
    let hasMore = true;
    let skip = 0;
    const batchSize = 200;

    while (hasMore) {
      const oldWinks = await base44.asServiceRole.entities.Wink.filter(
        { created_date: { $lt: cutoff.toISOString() } },
        undefined,
        batchSize,
        skip
      );

      if (oldWinks.length === 0) {
        hasMore = false;
        break;
      }

      const ids = oldWinks.map(w => w.id);
      await base44.asServiceRole.entities.Wink.deleteMany({ id: { $in: ids } });
      deleted += oldWinks.length;
      skip += batchSize;
    }

    return Response.json({
      success: true,
      expiry_hours: expiryHours,
      deleted,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});