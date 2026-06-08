import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const configs = await base44.asServiceRole.entities.SiteConfig.list();
  const isDevMode = configs[0]?.dev_mode === true;
  const apiKey = isDevMode
    ? Deno.env.get('WHOP_DEV_API_KEY')
    : Deno.env.get('WHOP_PROD_API_KEY');

  if (!apiKey) {
    return Response.json({ error: 'Whop API key not configured.' }, { status: 500 });
  }

  // Find the current user's MemberProfile
  const profiles = await base44.entities.MemberProfile.filter({ user_id: user.id });
  const profile = profiles[0];

  if (!profile) {
    return Response.json({ error: 'Profile not found.' }, { status: 404 });
  }

  const membershipId = profile.whop_membership_id;
  if (!membershipId) {
    return Response.json({ error: 'No Whop membership ID on file. Please contact support.' }, { status: 400 });
  }

  // Cancel the membership via Whop API
  const whopRes = await fetch(`https://api.whop.com/v5/memberships/${membershipId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!whopRes.ok) {
    const err = await whopRes.text();
    console.error('Whop cancel error:', err);
    return Response.json({ error: 'Cancellation failed. Please contact support.' }, { status: 500 });
  }

  // Update local profile status
  await base44.entities.MemberProfile.update(profile.id, {
    subscription_status: 'cancelled',
  });

  return Response.json({ success: true });
});