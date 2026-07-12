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

  const adFreeUntil = profile?.ad_free_until;
  const isAdFree = adFreeUntil && new Date(adFreeUntil) > new Date();

  const shouldRender =
    enabled &&
    activeZone &&
    !isAdFree &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !activeZone) return;

    // Remove any existing loader so jads.js re-initializes and processes
    // the zone fresh — required for SPA page navigations.
    const existing = document.getElementById('juicyads-jads-loader');
    if (existing) existing.remove();

    // Use the standard JuicyAds async queue (push, not replace)
    window.adsbyjuicy = window.adsbyjuicy || [];
    window.adsbyjuicy.push({ adzone: Number(activeZone) });

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
    <div className="my-4 flex justify-center">
      <ins
        id={String(activeZone)}
        className="adsbyjuicy"
        data-adzone={String(activeZone)}
        data-width={isMobile ? '300' : '728'}
        data-height={isMobile ? '100' : '90'}
        style={{ display: 'block', width: isMobile ? '300px' : '728px', height: isMobile ? '100px' : '90px', margin: '0 auto' }}
      />
    </div>
  );
}