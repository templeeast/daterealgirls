import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

/**
 * Deletes all demo users (user_id starting with "demo_") and cleans up all
 * associated data: conversations, messages, favorites, winks, private photos,
 * photo reviews, user reports, support tickets, token transactions, and payments.
 *
 * Uses deleteMany with $in (chunked in groups of 500) for all operations.
 * Avoids filter-with-$in calls which caused read traffic limits.
 */

// Chunk an array into groups of `size`
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

    // 1. Fetch all demo profiles (user_id starting with "demo_")
    const allDemoProfiles = await base44.asServiceRole.entities.MemberProfile.filter(
      { user_id: { $regex: '^demo_' } },
      null,
      5000
    );

    if (!allDemoProfiles || allDemoProfiles.length === 0) {
      return Response.json({ success: true, message: 'No demo users found', deleted: 0 });
    }

    const demoUserIds = allDemoProfiles.map(p => p.user_id).filter(Boolean);
    const demoProfileIds = allDemoProfiles.map(p => p.id).filter(Boolean);

    // Helper: batch deleteMany with $in, chunked to avoid query limits
    const batchDelete = async (entityName, fieldName, ids) => {
      for (const idChunk of chunk(ids, 500)) {
        try {
          await base44.asServiceRole.entities[entityName].deleteMany({ [fieldName]: { $in: idChunk } });
        } catch (e) {
          console.warn(`${entityName}.deleteMany(${fieldName}) failed:`, e.message);
        }
      }
    };

    // 2. Delete messages sent by demo users
    await batchDelete('Message', 'sender_id', demoUserIds);

    // 3. Delete conversations involving demo users (as either participant)
    await batchDelete('Conversation', 'participant_1_id', demoUserIds);
    await batchDelete('Conversation', 'participant_2_id', demoUserIds);

    // 4. Delete favorites (by demo users + favoriting demo profiles)
    await batchDelete('Favorite', 'user_id', demoUserIds);
    await batchDelete('Favorite', 'favorited_profile_id', demoProfileIds);

    // 5. Delete winks (sent by demo users + received by demo profiles)
    await batchDelete('Wink', 'sender_id', demoUserIds);
    await batchDelete('Wink', 'recipient_profile_id', demoProfileIds);

    // 6. Delete private photos, access grants, and views for demo profiles
    await batchDelete('PrivatePhoto', 'member_id', demoProfileIds);
    await batchDelete('PrivatePhotoAccess', 'owner_member_id', demoProfileIds);
    await batchDelete('PrivatePhotoAccess', 'viewer_member_id', demoProfileIds);
    await batchDelete('PrivatePhotoView', 'viewer_member_id', demoProfileIds);

    // 7. Delete photo reviews referencing demo profiles/users
    await batchDelete('PhotoReview', 'source_user_id', demoUserIds);
    await batchDelete('PhotoReview', 'source_profile_id', demoProfileIds);

    // 8. Delete user reports referencing demo profiles/users
    await batchDelete('UserReport', 'reporter_id', demoUserIds);
    await batchDelete('UserReport', 'reported_profile_id', demoProfileIds);

    // 9. Delete support tickets by demo users
    await batchDelete('SupportTicket', 'user_id', demoUserIds);

    // 10. Delete token transactions for demo users
    await batchDelete('TokenTransaction', 'user_id', demoUserIds);

    // 11. Delete payment records for demo users
    await batchDelete('Payment', 'user_id', demoUserIds);

    // 12. Finally, delete the demo profiles themselves
    await batchDelete('MemberProfile', 'id', demoProfileIds);

    return Response.json({
      success: true,
      profilesDeleted: allDemoProfiles.length,
      totalDemoUsersProcessed: allDemoProfiles.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}