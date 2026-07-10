import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const zip = body.zip?.trim();
    const countryCode = body.country_code?.trim().toUpperCase();

    if (!zip || !countryCode) {
      return Response.json({ error: 'zip and country_code are required' }, { status: 400 });
    }

    const apiUrl = `http://api.zippopotam.us/${countryCode}/${encodeURIComponent(zip)}`;
    const response = await fetch(apiUrl);

    if (response.status === 404) {
      return Response.json({ error: 'not_found', not_found: true }, { status: 404 });
    }

    if (!response.ok) {
      return Response.json({ error: `Geocoding service error (${response.status})` }, { status: 502 });
    }

    const data = await response.json();
    const place = data.places?.[0];

    if (!place) {
      return Response.json({ error: 'not_found', not_found: true }, { status: 404 });
    }

    return Response.json({
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude),
      place_name: place['place name'],
      state: place.state,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});