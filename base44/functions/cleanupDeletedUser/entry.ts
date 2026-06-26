import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function extractPublicId(url) {
  if (!url) return null;
  try {
    const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = `public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(params));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('signature', signature);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: formData,
  });
  return await res.json();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function should only run via automation (service role)
    const payload = await req.json();
    const deletedProfile = payload.data;
    if (!deletedProfile || !deletedProfile.user_id) {
      return Response.json({ error: 'Missing profile data' }, { status: 400 });
    }

    const userId = deletedProfile.user_id;
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');

    let cloudinaryDeleted = 0;
    let messagesDeleted = 0;
    let conversationsDeleted = 0;
    let favoritesDeleted = 0;
    let winksDeleted = 0;

    // 1. Delete Cloudinary profile photos (photo_1 through photo_15)
    if (cloudName && apiKey && apiSecret) {
      for (let i = 1; i <= 15; i++) {
        const url = deletedProfile[`photo_${i}`];
        if (url) {
          const publicId = extractPublicId(url);
          if (publicId) {
            const result = await deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId);
            if (result.result === 'ok') cloudinaryDeleted++;
          }
        }
      }
    }

    // 2. Delete all conversations this user participated in
    const asParticipant1 = await base44.asServiceRole.entities.Conversation.filter({ participant_1_id: userId });
    const asParticipant2 = await base44.asServiceRole.entities.Conversation.filter({ participant_2_id: userId });
    const allConversations = [...asParticipant1, ...asParticipant2];

    for (const conv of allConversations) {
      // Delete all messages in this conversation
      const messages = await base44.asServiceRole.entities.Message.filter({ conversation_id: conv.id });
      for (const msg of messages) {
        if (msg.image_url && cloudName && apiKey && apiSecret) {
          const publicId = extractPublicId(msg.image_url);
          if (publicId) {
            const result = await deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId);
            if (result.result === 'ok') cloudinaryDeleted++;
          }
        }
        await base44.asServiceRole.entities.Message.delete(msg.id);
        messagesDeleted++;
      }
      await base44.asServiceRole.entities.Conversation.delete(conv.id);
      conversationsDeleted++;
    }

    // 3. Delete all favorites by this user
    const favorites = await base44.asServiceRole.entities.Favorite.filter({ user_id: userId });
    for (const fav of favorites) {
      await base44.asServiceRole.entities.Favorite.delete(fav.id);
      favoritesDeleted++;
    }

    // 4. Delete all winks sent by this user
    const sentWinks = await base44.asServiceRole.entities.Wink.filter({ sender_id: userId });
    for (const wink of sentWinks) {
      await base44.asServiceRole.entities.Wink.delete(wink.id);
      winksDeleted++;
    }

    // 5. Delete all winks received by this user's profile
    const receivedWinks = await base44.asServiceRole.entities.Wink.filter({ recipient_profile_id: deletedProfile.id });
    for (const wink of receivedWinks) {
      await base44.asServiceRole.entities.Wink.delete(wink.id);
      winksDeleted++;
    }

    return Response.json({
      success: true,
      user_id: userId,
      cloudinary_images_deleted: cloudinaryDeleted,
      messages_deleted: messagesDeleted,
      conversations_deleted: conversationsDeleted,
      favorites_deleted: favoritesDeleted,
      winks_deleted: winksDeleted,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});