import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const profileId = payload.profileId || '6a637cf446cfaf200070f4d5';

    // Update the profile with garbage ethnicity from the Deno runtime
    await base44.asServiceRole.entities.MemberProfile.update(profileId, { ethnicity: 'DENO_TEST_VALUE' });

    return Response.json({ updated: true, profileId, ethnicity: 'DENO_TEST_VALUE' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});