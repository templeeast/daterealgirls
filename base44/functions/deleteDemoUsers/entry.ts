import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * Deletes all demo users (user_id starting with "demo_") and performs the same
 * cleanup as the normal user deletion flow (cleanupDeletedUser), ensuring no
 * orphaned data is left behind: conversations, messages, favorites, winks,
 * private photos, photo reviews, user reports, support tickets, token transactions,
 * and payments.
 *
 * Uses batch deleteMany with $in queries (chunked in groups of 500) for efficiency
 * when dealing with large numbers of demo users.
 */

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

// Chunk an array into groups of `size` to avoid query limits
function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
    const hasCloudinary = !!(cloudName && apiKey && apiSecret);

    // 1. Fetch ALL demo profiles (user_id starting with "demo_")
    let allDemoProfiles = [];
    while (true) {
      const batch = await base44.asServiceRole.entities.MemberProfile.filter(
        { user_id: { $regex: '^demo_' } },
        null,
        500
      );
      if (!batch || batch.length === 0) break;
      allDemoProfiles = allDemoProfiles.concat(batch);
      if (batch.length < 500) break;
    }

    if (allDemoProfiles.length === 0) {
      return Response.json({ success: true, message: 'No demo users found', deleted: 0 });
    }

    const demoUserIds = allDemoProfiles.map(p => p.user_id).filter(Boolean);
    const demoProfileIds = allDemoProfiles.map(p => p.id).filter(Boolean);

    const stats = {
      profilesDeleted: allDemoProfiles.length,
      conversationsDeleted: 0,
      messagesDeleted: 0,
      favoritesDeleted: 0,
      winksDeleted: 0,
      privatePhotosDeleted: 0,
      privatePhotoAccessDeleted: 0,
      privatePhotoViewsDeleted: 0,
      photoReviewsDeleted: 0,
      userReportsDeleted: 0,
      supportTicketsDeleted: 0,
      tokenTransactionsDeleted: 0,
      paymentsDeleted: 0,
      cloudinaryImagesDeleted: 0,
    };

    // 2. Delete Cloudinary images for demo profile photos (only Cloudinary-hosted)
    if (hasCloudinary) {
      for (const profile of allDemoProfiles) {
        for (let i = 1; i <= 15; i++) {
          const url = profile[`photo_${i}`];
          if (url && url.includes('cloudinary.com')) {
            const publicId = extractPublicId(url);
            if (publicId) {
              try {
                const result = await deleteCloudinaryImage(cloudName, apiKey, apiSecret, publicId);
                if (result.result === 'ok') stats.cloudinaryImagesDeleted++;
              } catch {}
            }
          }
        }
      }
    }

    // Helper: batch deleteMany with $in, chunked to avoid query limits
    const batchDelete = async (entityName, fieldName, ids) => {
      for (const idChunk of chunk(ids, 500)) {
        try {
          await base44.asServiceRole.entities[entityName].deleteMany({ [fieldName]: { $in: idChunk } });
        } catch (e) {
          console.warn(`${entityName}.deleteMany failed:`, e.message);
        }
      }
    };

    // 3. Find conversations involving demo users (as either participant)
    let convIds = new Set();
    for (const idChunk of chunk(demoUserIds, 500)) {
      const asP1 = await base44.asServiceRole.entities.Conversation.filter(
        { participant_1_id: { $in: idChunk } }, null, 2000
      );
      const asP2 = await base44.asServiceRole.entities.Conversation.filter(
        { participant_2_id: { $in: idChunk } }, null, 2000
      );
      for (const c of [...asP1, ...asP2]) convIds.add(c.id);
    }
    const convIdArray = [...convIds];

    // 4. Delete messages in those conversations, plus messages sent by demo users
    for (const idChunk of chunk(convIdArray, 500)) {
      try {
        await base44.asServiceRole.entities.Message.deleteMany({ conversation_id: { $in: idChunk } });
      } catch (e) {
        console.warn('Message.deleteMany by conversation failed:', e.message);
      }
    }
    await batchDelete('Message', 'sender_id', demoUserIds);

    // 5. Delete conversations involving demo users
    for (const idChunk of chunk(demoUserIds, 500)) {
      try {
        const asP1 = await base44.asServiceRole.entities.Conversation.filter(
          { participant_1_id: { $in: idChunk } }, null, 2000
        );
        for (const c of asP1) {
          try { await base44.asServiceRole.entities.Conversation.delete(c.id); stats.conversationsDeleted++; } catch {}
        }
      } catch {}
      try {
        const asP2 = await base44.asServiceRole.entities.Conversation.filter(
          { participant_2_id: { $in: idChunk } }, null, 2000
        );
        for (const c of asP2) {
          try { await base44.asServiceRole.entities.Conversation.delete(c.id); stats.conversationsDeleted++; } catch {}
        }
      } catch {}
    }

    // 6. Delete favorites (by demo users + favoriting demo profiles)
    await batchDelete('Favorite', 'user_id', demoUserIds);
    await batchDelete('Favorite', 'favorited_profile_id', demoProfileIds);

    // 7. Delete winks (sent by demo users + received by demo profiles)
    await batchDelete('Wink', 'sender_id', demoUserIds);
    await batchDelete('Wink', 'recipient_profile_id', demoProfileIds);

    // 8. Delete private photos, access grants, and views for demo profiles
    await batchDelete('PrivatePhoto', 'member_id', demoProfileIds);
    await batchDelete('PrivatePhotoAccess', 'owner_member_id', demoProfileIds);
    await batchDelete('PrivatePhotoAccess', 'viewer_member_id', demoProfileIds);
    await batchDelete('PrivatePhotoView', 'viewer_member_id', demoProfileIds);

    // 9. Delete photo reviews referencing demo profiles/users
    await batchDelete('PhotoReview', 'source_user_id', demoUserIds);
    await batchDelete('PhotoReview', 'source_profile_id', demoProfileIds);

    // 10. Delete user reports referencing demo profiles/users
    await batchDelete('UserReport', 'reporter_id', demoUserIds);
    await batchDelete('UserReport', 'reported_profile_id', demoProfileIds);

    // 11. Delete support tickets by demo users
    await batchDelete('SupportTicket', 'user_id', demoUserIds);

    // 12. Delete token transactions for demo users
    await batchDelete('TokenTransaction', 'user_id', demoUserIds);

    // 13. Delete payment records for demo users
    await batchDelete('Payment', 'user_id', demoUserIds);

    // 14. Finally, delete the demo profiles themselves (by id)
    await batchDelete('MemberProfile', 'id', demoProfileIds);

    return Response.json({
      success: true,
      ...stats,
      totalDemoUsersProcessed: allDemoProfiles.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}