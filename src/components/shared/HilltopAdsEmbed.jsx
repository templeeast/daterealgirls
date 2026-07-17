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

    // Use an about:blank iframe (via document.write) so each SPA navigation
    // gets a fresh document scope. HilltopAds maintains global JS state that
    // prevents re-rendering when the script is re-injected into the main
    // document. An about:blank iframe inherits the parent page's referrer,
    // satisfying HilltopAds' domain validation, while isolating JS state.
    const iframe = document.createElement('iframe');
    iframe.style.width = width + 'px';
    iframe.style.height = height + 'px';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    containerRef.current.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(
      '<html><head><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>' +
      '<scr' + 'ipt type="text/javascript">' +
      'var s=document.createElement("script");' +
      's.type="text/javascript";' +
      's.async=true;' +
      's.referrerPolicy="no-referrer-when-downgrade";' +
      'try{s.settings={};}catch(e){}' +
      's.src=' + JSON.stringify(fullUrl) + ';' +
      'document.body.appendChild(s);' +
      '</scr' + 'ipt>' +
      '</body></html>'
    );
    doc.close();

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [shouldRender, activeUrl, width, height]);

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