import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Renders a HilltopAds 300×250 banner ad (desktop + mobile).
 * The scriptUrl is the s.src value from the HilltopAds embed code.
 */
export default function HilltopAdsEmbed({ scriptUrl }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const containerRef = useRef(null);

  const gender = profile?.gender;
  const enabled = config?.hilltopads_enabled;
  const showMen = config?.hilltopads_show_men !== false;
  const showWomen = config?.hilltopads_show_women || false;

  const shouldRender =
    enabled &&
    scriptUrl &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !scriptUrl || !containerRef.current) return;

    // Clear any previous ad content — required for SPA page navigations.
    containerRef.current.innerHTML = '';

    // Inject the HilltopAds script; the ad renders at the script's DOM position.
    const s = document.createElement('script');
    s.settings = {};
    s.src = scriptUrl;
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    containerRef.current.appendChild(s);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [scriptUrl, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <div
        ref={containerRef}
        style={{ width: '300px', height: '250px', margin: '0 auto' }}
      />
    </div>
  );
}