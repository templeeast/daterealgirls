import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data?.recipient_profile_id || !data?.sender_name) {
      return Response.json({ skipped: true });
    }

    // Look up the recipient's profile to get their user_id
    const recipientProfile = await base44.asServiceRole.entities.MemberProfile.get(data.recipient_profile_id);
    if (!recipientProfile?.user_id) {
      return Response.json({ skipped: 'no recipient profile' });
    }

    // Look up the recipient's User record to get their email
    const users = await base44.asServiceRole.entities.User.filter({ id: recipientProfile.user_id });
    const recipientUser = users?.[0];
    if (!recipientUser?.email) {
      return Response.json({ skipped: 'no email found' });
    }

    const recipientName = recipientProfile.display_name || 'there';
    const senderName = data.sender_name || 'Someone';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientUser.email,
      subject: `😉 ${senderName} winked at you!`,
      body: `Hi ${recipientName},\n\n${senderName} just sent you a wink! Log in to check your profile and see who's interested.\n\nhttps://demo.daterealgirls.com/my-profile\n\n— The DateRealGirls Team`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});