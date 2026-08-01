import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const city = body.city?.trim();
    const country = body.country?.trim();

    if (!city) {
      return Response.json({ error: 'city is required' }, { status: 400 });
    }

    // Use OpenStreetMap Nominatim — free, no API key needed
    // Format: city + country for best accuracy
    const query = country ? `${city}, ${country}` : city;
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'DateRealGirls/1.0 (geocoding service)',
      },
    });

    if (!response.ok) {
      return Response.json({ error: `Geocoding service error (${response.status})` }, { status: 502 });
    }

    const data = await response.json();
    const result = data?.[0];

    if (!result) {
      return Response.json({ error: 'not_found', not_found: true }, { status: 404 });
    }

    return Response.json({
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      display_name: result.display_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});