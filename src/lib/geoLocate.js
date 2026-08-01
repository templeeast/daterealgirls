import { base44 } from '@/api/base44Client';
import { getCountryCode } from './geoUtils';

/**
 * Resolves lat/lng coordinates for a profile.
 * Tries zip code geocoding first (via Zippopotam.us), then falls back
 * to city-name geocoding (via OpenStreetMap Nominatim) if zip is missing,
 * fails, or returns no coordinates.
 *
 * @param {string} country - Country name (e.g. "United States")
 * @param {string} city - City name (e.g. "New York")
 * @param {string} zip - Zip/postal code (optional)
 * @returns {Promise<{latitude: number, longitude: number} | {}>} - geoData object or empty if both fail
 */
export async function resolveGeoCoordinates(country, city, zip) {
  // Step 1: Try zip code geocoding if a zip is provided
  if (zip) {
    const countryCode = getCountryCode(country);
    if (countryCode) {
      try {
        const geoRes = await base44.functions.invoke('geocodeZip', { zip, country_code: countryCode });
        if (geoRes.data?.latitude != null) {
          return { latitude: geoRes.data.latitude, longitude: geoRes.data.longitude };
        }
      } catch (e) {
        // Zip geocoding failed — fall through to city geocoding
      }
    }
  }

  // Step 2: Fall back to city-name geocoding
  if (city) {
    try {
      const geoRes = await base44.functions.invoke('geocodeCity', { city, country });
      if (geoRes.data?.latitude != null) {
        return { latitude: geoRes.data.latitude, longitude: geoRes.data.longitude };
      }
    } catch (e) {
      // City geocoding also failed — return empty
    }
  }

  return {};
}