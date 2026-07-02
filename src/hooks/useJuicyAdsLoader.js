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

    // Defer script injection so React has committed the <ins> DOM nodes first
    const timer = setTimeout(() => {
      const existing = document.getElementById('juicyads-jads-loader');
      if (existing) existing.remove();

      window.adsbyjuicy = validZones.map(z => ({ adzone: Number(z) }));

      const loader = document.createElement('script');
      loader.id = 'juicyads-jads-loader';
      loader.type = 'text/javascript';
      loader.async = true;
      loader.setAttribute('data-cfasync', 'false');
      loader.src = 'https://adserver.juicyads.com/js/jads.js';
      document.head.appendChild(loader);
    }, 100);

    return () => clearTimeout(timer);
  }, [zoneKey]);
}