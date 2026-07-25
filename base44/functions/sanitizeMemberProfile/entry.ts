import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const VALID_ETHNICITIES = [
  'asian', 'black', 'caucasian', 'hispanic', 'middle_eastern',
  'native_american', 'pacific_islander', 'mixed', 'other', 'rather_not_say',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json();
    const profile = payload.data;

    if (!profile?.id) {
      return Response.json({ skipped: true, reason: 'no profile data' });
    }

    const ethnicity = profile.ethnicity;
    if (ethnicity != null && ethnicity !== '' && !VALID_ETHNICITIES.includes(ethnicity)) {
      await base44.asServiceRole.entities.MemberProfile.update(profile.id, { ethnicity: null });
      return Response.json({ corrected: true, field: 'ethnicity', invalidValue: ethnicity });
    }

    return Response.json({ skipped: true, reason: 'ethnicity valid or not set' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});