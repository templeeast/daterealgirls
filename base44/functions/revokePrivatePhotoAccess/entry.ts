import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { viewerMemberId } = await req.json();
    if (!viewerMemberId) return Response.json({ error: 'viewerMemberId is required' }, { status: 400 });

    const me = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const myProfile = me[0];
    if (!myProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const records = await base44.asServiceRole.entities.PrivatePhotoAccess.filter({
      owner_member_id:  myProfile.id,
      viewer_member_id: viewerMemberId,
    });
    const access = records[0];
    if (!access || access.status !== 'granted') {
      return Response.json({ error: 'No active grant to revoke' });
    }

    await base44.asServiceRole.entities.PrivatePhotoAccess.update(access.id, {
      status:       'revoked',
      responded_at: new Date().toISOString(),
    });

    // Get viewer to find conversation
    const viewerProfiles = await base44.asServiceRole.entities.MemberProfile.filter({ id: viewerMemberId });
    const viewerProfile = viewerProfiles[0];
    if (viewerProfile) {
      const convos1 = await base44.asServiceRole.entities.Conversation.filter({
        participant_1_id: user.id, participant_2_id: viewerProfile.user_id,
      });
      const convos2 = await base44.asServiceRole.entities.Conversation.filter({
        participant_1_id: viewerProfile.user_id, participant_2_id: user.id,
      });
      const conversationId = [...convos1, ...convos2][0]?.id;
      if (conversationId) {
        await base44.asServiceRole.entities.Message.create({
          conversation_id:         conversationId,
          sender_id:               user.id,
          sender_name:             myProfile.display_name || 'A member',
          content:                 '🔒 Private photo access has been revoked.',
          message_type:            'private_photo_access_denied',
          private_photo_access_id: access.id,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});