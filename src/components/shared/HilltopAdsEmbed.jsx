import React, { useState, useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Renders a HilltopAds 300×250 banner ad via direct script injection.
 *
 * scriptUrl       — s.src for the desktop zone.
 * scriptUrlMobile — s.src for the mobile-mode zone (optional).
 *
 * Uses direct DOM injection (not an iframe) so the ad script runs in the
 * page's real origin — HilltopAds validates the referrer/domain and won't
 * render inside an about:srcdoc iframe.
 */
export default function HilltopAdsEmbed({ scriptUrl, scriptUrlMobile }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(window.innerWidth < 768);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const containerRef = useRef(null);

  const gender = profile?.gender;
  const enabled = config?.hilltopads_enabled;
  const showMen = config?.hilltopads_show_men !== false;
  const showWomen = config?.hilltopads_show_women || false;

  const activeUrl = isMobile && scriptUrlMobile ? scriptUrlMobile : scriptUrl;
  const width = 300;
  const height = isMobile ? 100 : 250;

  const adFreeUntil = profile?.ad_free_until;
  const isAdFree = adFreeUntil && new Date(adFreeUntil) > new Date();

  const genderBlocked =
    (gender === 'male' && !showMen) || (gender === 'female' && !showWomen);

  const shouldRender =
    enabled && activeUrl && !isAdFree && !genderBlocked;

  useEffect(() => {
    if (!shouldRender || !activeUrl || !containerRef.current) return;

    // Clear any previous ad content
    containerRef.current.innerHTML = '';

    // HilltopAds code blocks display s.src with escaped slashes (\/).
    const cleanUrl = activeUrl.replace(/\\/g, '');
    const fullUrl = cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl;

    // Cache-buster: browsers won't re-execute a script with the same src,
    // so on SPA navigations the ad never renders. A unique query param
    // forces the browser to treat each injection as a fresh resource.
    const cacheBustUrl = fullUrl + (fullUrl.includes('?') ? '&' : '?') + '_cb=' + Date.now();

    // Standard HilltopAds integration: create a script element with
    // s.settings and s.src, then append it to the container.
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    try {
      s.settings = {};
    } catch (e) {
      // Some browsers don't allow setting arbitrary properties on script elements
    }
    s.src = cacheBustUrl;
    containerRef.current.appendChild(s);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [shouldRender, activeUrl]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <div
        ref={containerRef}
        style={{ width: width + 'px', height: height + 'px', display: 'block', margin: '0 auto' }}
      />
    </div>
  );
}