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
    // the queue fresh — required for SPA page navigations.
    const existing = document.getElementById('juicyads-jads-loader');
    if (existing) existing.remove();

    // Reset the queue with just the current zone
    window.adsbyjuicy = [{ adzone: Number(activeZone) }];

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
        className="block"
        style={{ display: 'block', minHeight: '90px' }}
      />
    </div>
  );
}