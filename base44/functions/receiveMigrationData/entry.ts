import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';
import { entityForeignKeys, entitiesWithSourceId } from '../../shared/migrationConfig.ts';

export default async function(req) {
  try {
    // Authenticate by shared API key (no user session — this is a webhook-style endpoint)
    const apiKey = req.headers.get('X-Migration-API-Key');
    const expectedKey = Deno.env.get('MIGRATION_API_KEY');
    if (!apiKey || !expectedKey || apiKey !== expectedKey) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { entityName, records, uniqueKeyFields } = body;

    if (!entityName || !records) {
      return Response.json({ error: 'entityName and records are required' }, { status: 400 });
    }

    let created = 0;
    let updated = 0;

    const hasSourceId = entitiesWithSourceId.includes(entityName);

    // ---- Batch FK remapping: for each FK field, look up the referenced entity by source_id ----
    const fkConfig = entityForeignKeys[entityName] || {};
    const fkMaps = {};

    for (const field in fkConfig) {
      const refEntity = fkConfig[field];
      const oldIds = records
        .map(function(r) { return r[field]; })
        .filter(function(id) { return id != null; });

      if (oldIds.length === 0) continue;

      const uniqueOldIds = Array.from(new Set(oldIds));
      const refRecords = await base44.asServiceRole.entities[refEntity].filter(
        { source_id: { $in: uniqueOldIds } },
        '-updated_date',
        500
      );

      fkMaps[field] = {};
      for (const ref of refRecords) {
        fkMaps[field][ref.source_id] = ref.id;
      }
    }

    // ---- Process each record ----
    for (const record of records) {
      // Strip built-in system fields
      const { id, created_date, updated_date, created_by, created_by_id, ...recordData } = record;

      // Remap FK fields using the lookup maps built above
      for (const field in fkConfig) {
        if (recordData[field] && fkMaps[field] && fkMaps[field][recordData[field]]) {
          recordData[field] = fkMaps[field][recordData[field]];
        }
      }

      // Match existing record in destination
      let existing = null;

      if (uniqueKeyFields === null) {
        // Singleton — always treat the single most recently updated record as "existing"
        const existingRecords = await base44.asServiceRole.entities[entityName].list('-updated_date', 1);
        existing = existingRecords[0] || null;
      } else if (uniqueKeyFields && uniqueKeyFields.length > 0) {
        // Match by unique key fields
        const filter = {};
        let allFieldsPresent = true;
        for (const key of uniqueKeyFields) {
          if (recordData[key] != null) {
            filter[key] = recordData[key];
          } else {
            allFieldsPresent = false;
            break;
          }
        }
        if (allFieldsPresent && Object.keys(filter).length > 0) {
          const existingRecords = await base44.asServiceRole.entities[entityName].filter(filter, '-updated_date', 1);
          existing = existingRecords[0] || null;
        }
      }

      // Strip source_id if the entity doesn't have it in its schema
      if (!hasSourceId) {
        delete recordData.source_id;
      }

      // Create or update
      if (existing) {
        await base44.asServiceRole.entities[entityName].update(existing.id, recordData);
        updated++;
      } else {
        await base44.asServiceRole.entities[entityName].create(recordData);
        created++;
      }
    }

    return Response.json({
      success: true,
      created: created,
      updated: updated,
      message: entityName + ': ' + created + ' created, ' + updated + ' updated',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}