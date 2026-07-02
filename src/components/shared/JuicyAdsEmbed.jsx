import React, { useEffect, useRef, useState } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JuicyAdsEmbed({ zone, zoneMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();
  const insRef = useRef(null);
  const [adFailed, setAdFailed] = useState(false);

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
    setAdFailed(false);

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

    // After 5 seconds, check if the ad actually rendered meaningful content.
    const checkTimer = setTimeout(() => {
      const ins = insRef.current;
      if (!ins) { setAdFailed(true); return; }
      // An iframe means the ad loaded successfully
      if (ins.querySelector('iframe')) return;
      const imgs = ins.querySelectorAll('img');
      if (imgs.length === 0) {
        // No iframe, no images — ad didn't render at all
        setAdFailed(true);
      } else {
        // Has images — hide only if every image is broken
        const allBroken = Array.from(imgs).every(img =>
          img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)
        );
        if (allBroken) setAdFailed(true);
      }
    }, 5000);

    return () => clearTimeout(checkTimer);
  }, [activeZone, shouldRender]);

  // Capture image load errors within the <ins> element.
  // The error event doesn't bubble, but a capture-phase listener on the
  // parent catches it — this hides the ad immediately when a creative 404s.
  useEffect(() => {
    if (!shouldRender || !activeZone) return;
    const ins = insRef.current;
    if (!ins) return;

    const handleError = (e) => {
      if (e.target && e.target.tagName === 'IMG') {
        setAdFailed(true);
      }
    };
    ins.addEventListener('error', handleError, true);
    return () => ins.removeEventListener('error', handleError, true);
  }, [shouldRender, activeZone]);

  if (!shouldRender || adFailed) return null;

  return (
    <div className="my-4 flex justify-center">
      <ins
        ref={insRef}
        id={String(activeZone)}
        className="adsbyjuicy"
        data-adzone={String(activeZone)}
        style={{ display: 'block', minHeight: '90px' }}
      />
    </div>
  );
}