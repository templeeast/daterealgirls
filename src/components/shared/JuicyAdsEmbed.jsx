import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JuicyAdsEmbed({ zone, zoneMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();
  const containerRef = useRef(null);

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
    if (!shouldRender || !activeZone || !containerRef.current) return;

    // Create the <ins> element imperatively so React's virtual DOM
    // doesn't conflict with jads.js modifying its innerHTML.
    const container = containerRef.current;
    container.innerHTML = '';

    const ins = document.createElement('ins');
    ins.className = 'adsbyjuicy';
    ins.setAttribute('data-adzone', String(activeZone));
    ins.style.display = 'block';
    ins.style.margin = '0 auto';
    container.appendChild(ins);

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

    return () => {
      container.innerHTML = '';
    };
  }, [activeZone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center" ref={containerRef} />
  );
}