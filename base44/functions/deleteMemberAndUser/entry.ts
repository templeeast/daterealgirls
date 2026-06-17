import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Look up the profile to get the user_id
    const profiles = await base44.entities.MemberProfile.filter({ id: profileId }, null, 1);
    if (!profiles || profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];

    const userId = profile.user_id;

    // Delete the profile first (this triggers the cleanupDeletedUser automation)
    await base44.entities.MemberProfile.delete(profileId);

    // Delete the User record (requires service role)
    if (userId) {
      await base44.asServiceRole.entities.User.delete(userId);
    }

    return Response.json({ success: true, profileId, userId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});