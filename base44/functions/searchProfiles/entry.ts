import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      gender, lookingFor, ethnicity, ageMin, ageMax,
      country, city, search, tagSearch,
      zipLat, zipLng, zipRadius,
      excludeUserId,
      page = 1,
      limit = 30
    } = body;

    // Build the filter query — base exclusions
    const query = {
      is_active: true,
      is_suspended: false,
      profile_complete: true,
      is_private: { $ne: true },
      verification_status: { $ne: 'rejected' },
      profile_review_status: { $ne: 'rejected' },
    };

    if (excludeUserId) {
      query.user_id = { $ne: excludeUserId };
    }

    // Skip-based pagination (SDK sort by -created_date with _id tiebreaker is stable)
    const skip = (page - 1) * (limit || 30);

    // Filter parameters
    if (gender && gender !== 'all') {
      query.gender = gender;
    }
    if (lookingFor && lookingFor !== 'all') {
      query.looking_for = lookingFor;
    }
    if (ethnicity && ethnicity !== 'all') {
      query.ethnicity = ethnicity;
    }

    if (ageMin || ageMax) {
      query.age = {};
      if (ageMin) query.age.$gte = parseInt(ageMin, 10);
      if (ageMax) query.age.$lte = parseInt(ageMax, 10);
    }

    if (country) query.location_country = country;
    if (city) query.location_city = { $regex: escapeRegex(city.trim()), $options: 'i' };

    // Zip radius bounding box (coarse filter — frontend applies exact Haversine)
    if (zipLat != null && zipLng != null && zipRadius) {
      const latDelta = zipRadius / 69;
      const lngDelta = zipRadius / (69 * Math.cos(zipLat * Math.PI / 180));
      query.latitude = { $gte: zipLat - latDelta, $lte: zipLat + latDelta };
      query.longitude = { $gte: zipLng - lngDelta, $lte: zipLng + lngDelta };
    }

    // Text search across multiple fields
    if (search && search.trim()) {
      const searchString = escapeRegex(search.trim());
      query.$or = [
        { display_name: { $regex: searchString, $options: 'i' } },
        { location_city: { $regex: searchString, $options: 'i' } },
        { location_country: { $regex: searchString, $options: 'i' } },
        { bio: { $regex: searchString, $options: 'i' } },
        { tag_id: { $regex: searchString, $options: 'i' } },
      ];
    }

    const effectiveLimit = Math.min(limit || 30, 100);

    // Execute paginated query with skip
    const results = await base44.asServiceRole.entities.MemberProfile.filter(
      query,
      '-created_date',
      effectiveLimit,
      skip
    );

    const hasMore = results.length === effectiveLimit;

    // Private profile tag match (only on first page)
    let tagMatch = null;
    if (page === 1 && tagSearch && tagSearch.trim()) {
      const tagString = escapeRegex(tagSearch.trim());
      const privateResults = await base44.asServiceRole.entities.MemberProfile.filter(
        {
          is_active: true,
          is_suspended: false,
          profile_complete: true,
          is_private: true,
          tag_id: { $regex: tagString, $options: 'i' },
        },
        null,
        1
      );
      if (privateResults.length > 0) {
        tagMatch = privateResults[0];
      }
    }

    return Response.json({
      profiles: results,
      hasMore,
      page,
      tagMatch,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}