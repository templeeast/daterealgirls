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

    // 1. Load the JuicyAds loader script once
    if (!document.getElementById('juicyads-jads-loader')) {
      const loader = document.createElement('script');
      loader.id = 'juicyads-jads-loader';
      loader.type = 'text/javascript';
      loader.async = true;
      loader.setAttribute('data-cfasync', 'false');
      loader.src = 'https://adserver.juicyads.com/js/jads.js';
      document.head.appendChild(loader);
    }

    // 2. Push the ad zone to render the ad into the <ins> element
    window.adsbyjuicy = window.adsbyjuicy || [];
    window.adsbyjuicy.push({ adzone: Number(activeZone) });
  }, [activeZone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <ins
        id={String(activeZone)}
        className="block"
        style={{ display: 'block', minHeight: '90px' }}
      />
    </div>
  );
}