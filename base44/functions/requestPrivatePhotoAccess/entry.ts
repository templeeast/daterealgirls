import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { ownerMemberId } = await req.json();
    if (!ownerMemberId) return Response.json({ error: 'ownerMemberId is required' }, { status: 400 });

    const me = await base44.entities.MemberProfile.filter({ user_id: user.id });
    const myProfile = me[0];
    if (!myProfile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    if (myProfile.id === ownerMemberId) {
      return Response.json({ error: 'Cannot request your own photos' });
    }

    if (myProfile.didit_verification_status !== 'Approved') {
      return Response.json({ error: 'You must verify your identity before requesting private photo access.' });
    }

    const existing = await base44.asServiceRole.entities.PrivatePhotoAccess.filter({
      owner_member_id: ownerMemberId,
      viewer_member_id: myProfile.id,
    });
    if (existing[0]?.status === 'granted') return Response.json({ alreadyGranted: true });
    if (existing[0]?.status === 'pending')  return Response.json({ alreadyPending: true });

    // Get the owner profile to build conversation
    const ownerProfiles = await base44.asServiceRole.entities.MemberProfile.filter({ id: ownerMemberId });
    const ownerProfile = ownerProfiles[0];
    if (!ownerProfile) return Response.json({ error: 'Owner profile not found' }, { status: 404 });

    // Find or create conversation
    let conversationId;
    const convos1 = await base44.asServiceRole.entities.Conversation.filter({
      participant_1_id: user.id, participant_2_id: ownerProfile.user_id,
    });
    const convos2 = await base44.asServiceRole.entities.Conversation.filter({
      participant_1_id: ownerProfile.user_id, participant_2_id: user.id,
    });
    const existing_convo = [...convos1, ...convos2][0];

    if (existing_convo) {
      conversationId = existing_convo.id;
    } else {
      const convo = await base44.asServiceRole.entities.Conversation.create({
        participant_1_id:   user.id,
        participant_2_id:   ownerProfile.user_id,
        participant_1_name: myProfile.display_name || 'Member',
        participant_2_name: ownerProfile.display_name || 'Member',
        participant_1_photo: myProfile.photo_1 || '',
        participant_2_photo: ownerProfile.photo_1 || '',
      });
      conversationId = convo.id;
    }

    // Create access record
    const access = await base44.asServiceRole.entities.PrivatePhotoAccess.create({
      owner_member_id:  ownerMemberId,
      viewer_member_id: myProfile.id,
      status:           'pending',
      requested_at:     new Date().toISOString(),
    });

    // Send request message
    await base44.asServiceRole.entities.Message.create({
      conversation_id:         conversationId,
      sender_id:               user.id,
      sender_name:             myProfile.display_name || 'A member',
      content:                 '🔒 Requested access to your private photos.',
      message_type:            'private_photo_request',
      private_photo_access_id: access.id,
    });

    return Response.json({ success: true, accessId: access.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});