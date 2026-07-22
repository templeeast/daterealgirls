import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessId, response } = await req.json();
    if (!accessId || !response) return Response.json({ error: 'accessId and response are required' }, { status: 400 });

    const accessRecords = await base44.asServiceRole.entities.PrivatePhotoAccess.filter({ id: accessId });
    const access = accessRecords[0];
    if (!access) return Response.json({ error: 'Access record not found' }, { status: 404 });

    const me = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const myProfile = me[0];
    if (!myProfile || access.owner_member_id !== myProfile.id) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    await base44.asServiceRole.entities.PrivatePhotoAccess.update(access.id, {
      status:       response,
      responded_at: new Date().toISOString(),
    });

    // Get viewer profile to find conversation
    const viewerProfiles = await base44.asServiceRole.entities.MemberProfile.filter({ id: access.viewer_member_id });
    const viewerProfile = viewerProfiles[0];

    let convo;
    if (viewerProfile) {
      const convos1 = await base44.asServiceRole.entities.Conversation.filter({
        participant_1_id: user.id, participant_2_id: viewerProfile.user_id,
      });
      const convos2 = await base44.asServiceRole.entities.Conversation.filter({
        participant_1_id: viewerProfile.user_id, participant_2_id: user.id,
      });
      convo = [...convos1, ...convos2][0];
    }

    if (convo) {
      const replyContent = response === 'granted'
        ? '✅ Access to my private photos has been granted!'
        : '❌ Private photo access request was declined.';
      await base44.asServiceRole.entities.Message.create({
        conversation_id:         convo.id,
        sender_id:               user.id,
        sender_name:             myProfile.display_name || 'A member',
        content:                 replyContent,
        message_type:            response === 'granted' ? 'private_photo_access_granted' : 'private_photo_access_denied',
        private_photo_access_id: access.id,
      });

      // Update conversation so the reply appears in the Messages list with an unread badge
      const isOwnerP1 = convo.participant_1_id === user.id;
      const viewerUnread = isOwnerP1
        ? (convo.unread_count_2 || 0)
        : (convo.unread_count_1 || 0);
      await base44.asServiceRole.entities.Conversation.update(convo.id, {
        last_message: replyContent.slice(0, 100),
        last_message_date: new Date().toISOString(),
        [isOwnerP1 ? 'unread_count_2' : 'unread_count_1']: viewerUnread + 1,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});