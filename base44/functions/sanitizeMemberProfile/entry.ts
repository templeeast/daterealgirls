import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const VALID_ETHNICITIES = [
  'asian', 'black', 'caucasian', 'hispanic', 'middle_eastern',
  'native_american', 'pacific_islander', 'mixed', 'other', 'rather_not_say',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const eventId = payload.event?.entity_id;
    const profile = payload.data;
    const entityId = eventId || profile?.id;

    if (!entityId) {
      return Response.json({ skipped: true, reason: 'no entity id' });
    }

    // Use ethnicity from payload data if available; otherwise fetch from database
    // (handles payload_too_large or missing data field in entity automation payloads)
    let ethnicity = profile?.ethnicity;
    if (ethnicity === undefined) {
      const fetched = await base44.asServiceRole.entities.MemberProfile.filter({ id: entityId });
      ethnicity = fetched[0]?.ethnicity;
    }

    if (ethnicity != null && ethnicity !== '' && !VALID_ETHNICITIES.includes(ethnicity)) {
      await base44.asServiceRole.entities.MemberProfile.update(entityId, { ethnicity: null });
      return Response.json({ corrected: true, field: 'ethnicity', invalidValue: ethnicity });
    }

    return Response.json({ skipped: true, reason: 'ethnicity valid or not set' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});