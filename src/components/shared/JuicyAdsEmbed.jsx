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
    if (!shouldRender) return;

    // Load the JuicyAds loader script once per page
    if (!document.getElementById('juicyads-jam-loader')) {
      const loader = document.createElement('script');
      loader.id = 'juicyads-jam-loader';
      loader.async = true;
      loader.src = 'https://cdn.juicyads.com/js/jam.js';
      document.head.appendChild(loader);
    }

    return () => {
      const container = document.getElementById(`juicyads-zone-${activeZone}`);
      if (container) container.innerHTML = '';
    };
  }, [activeZone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <ins
        id={`juicyads-zone-${activeZone}`}
        className="adsbyjuicy"
        data-zone-id={activeZone}
        style={{ display: 'block' }}
      />
    </div>
  );
}