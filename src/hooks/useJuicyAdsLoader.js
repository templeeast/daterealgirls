import { useEffect } from 'react';

/**
 * Loads the JuicyAds jads.js script once with all provided zone IDs
 * in the adsbyjuicy queue. Designed for pages with multiple ad zones
 * (e.g. Browse). Each zone's <ins id="ZONE_ID"> element must be
 * rendered separately in the DOM — this hook only handles the
 * queue + script injection.
 *
 * @param {string[]} zones - Array of JuicyAds zone ID strings
 */
export default function useJuicyAdsLoader(zones) {
  const zoneKey = zones.filter(Boolean).join(',');

  useEffect(() => {
    if (!zoneKey) return;

    const validZones = zoneKey.split(',').filter(Boolean);

    // Remove any existing loader so jads.js re-initializes fresh
    // (required for SPA page navigations and zone set changes).
    const existing = document.getElementById('juicyads-jads-loader');
    if (existing) existing.remove();

    // Reset the queue with all zones for this page
    window.adsbyjuicy = validZones.map(z => ({ adzone: Number(z) }));

    const loader = document.createElement('script');
    loader.id = 'juicyads-jads-loader';
    loader.type = 'text/javascript';
    loader.async = true;
    loader.setAttribute('data-cfasync', 'false');
    loader.src = 'https://adserver.juicyads.com/js/jads.js';
    document.head.appendChild(loader);

    return () => {
      const el = document.getElementById('juicyads-jads-loader');
      if (el) el.remove();
      window.adsbyjuicy = undefined;
    };
  }, [zoneKey]);
}