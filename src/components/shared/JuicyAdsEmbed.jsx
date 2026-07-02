import React, { useEffect } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JuicyAdsEmbed({ zone, zoneMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();

  const activeZone = (zoneMobile && isMobile) ? zoneMobile : zone;

  const gender = profile?.gender;
  const enabled = config?.juicyads_enabled;
  const showMen = config?.juicyads_show_men !== false;
  const showWomen = config?.juicyads_show_women || false;

  const shouldRender =
    enabled &&
    activeZone &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !activeZone) return;

    // Remove any existing loader so jads.js re-initializes and processes
    // the <ins> element fresh — required for SPA page navigations.
    const existing = document.getElementById('juicyads-jads-loader');
    if (existing) existing.remove();

    // Standard JuicyAds embed: jads.js auto-discovers .adsbyjuicy[data-adzone]
    // elements and renders the full zone config (including multi-column layout).
    // No queue push — that creates a separate single-ad insertion.
    const loader = document.createElement('script');
    loader.id = 'juicyads-jads-loader';
    loader.type = 'text/javascript';
    loader.async = true;
    loader.setAttribute('data-cfasync', 'false');
    loader.src = 'https://adserver.juicyads.com/js/jads.js';
    document.head.appendChild(loader);
  }, [activeZone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 w-full flex justify-center">
      <ins
        id={String(activeZone)}
        className="adsbyjuicy"
        data-adzone={String(activeZone)}
        style={{ display: 'block', width: '100%', minHeight: '250px' }}
      />
    </div>
  );
}