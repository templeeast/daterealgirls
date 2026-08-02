import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { entityUniqueKeys } from '../../shared/migrationConfig.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { entityName, since, productionUrl } = body;

    if (!productionUrl) return Response.json({ success: false, error: 'productionUrl is required' }, { status: 400 });
    if (!entityName) return Response.json({ success: false, error: 'entityName is required' }, { status: 400 });

    const uniqueKeyFields = entityUniqueKeys[entityName];
    const apiKey = Deno.env.get('MIGRATION_API_KEY');
    if (!apiKey) return Response.json({ success: false, error: 'MIGRATION_API_KEY not configured' }, { status: 500 });

    // Build query — incremental if `since` is provided, else full
    const query = {};
    if (since) {
      query.updated_date = { $gt: since };
    }

    // Fetch records in batches (up to 5000 total)
    const allRecords = [];
    const batchSize = 100;
    let skip = 0;
    while (allRecords.length < 5000) {
      const batch = await base44.asServiceRole.entities[entityName].filter(query, '-updated_date', batchSize, skip);
      allRecords.push(...batch);
      if (batch.length < batchSize) break;
      skip += batchSize;
    }

    if (allRecords.length === 0) {
      return Response.json({ success: true, message: 'No records found for ' + entityName });
    }

    // Attach source_id (old record id) to each record for FK remapping on the receiver
    const recordsWithSourceId = allRecords.map(function(r) {
      return { ...r, source_id: r.id };
    });

    // POST to the destination app's receiveMigrationData function
    const receiveUrl = productionUrl.replace(/\/$/, '') + '/api/functions/receiveMigrationData';
    const response = await fetch(receiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Migration-API-Key': apiKey,
      },
      body: JSON.stringify({
        entityName: entityName,
        records: recordsWithSourceId,
        uniqueKeyFields: uniqueKeyFields,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ success: false, error: result.error || ('Destination returned ' + response.status) });
    }

    return Response.json({
      success: true,
      message: result.message || ('Migrated ' + allRecords.length + ' records for ' + entityName),
      count: allRecords.length,
      destinationResult: result,
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}