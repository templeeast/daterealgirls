import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch site config for retention days
    const configs = await base44.asServiceRole.entities.SiteConfig.list();
    const config = configs[0];
    const retentionDays = config?.chat_retention_days ?? 90;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let deleted = 0;
    let hasMore = true;
    let skip = 0;
    const batchSize = 200;

    while (hasMore) {
      const oldMessages = await base44.asServiceRole.entities.Message.filter(
        { created_date: { $lt: cutoff.toISOString() } },
        undefined,
        batchSize,
        skip
      );

      if (oldMessages.length === 0) {
        hasMore = false;
        break;
      }

      for (const msg of oldMessages) {
        await base44.asServiceRole.entities.Message.delete(msg.id);
        deleted++;
      }

      skip += batchSize;
    }

    return Response.json({
      success: true,
      retention_days: retentionDays,
      deleted,
      cutoff: cutoff.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});