import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders a HilltopAds 300×250 banner ad.
 * scriptUrl      — s.src for desktop zone.
 * scriptUrlMobile — s.src for the mobile-mode zone (optional).
 *
 * On mobile screens, the mobile zone is used if set; otherwise falls back
 * to the desktop zone.
 *
 * HilltopAds MultiTag Banner scripts use fixed/absolute positioning that
 * breaks out of any container div. We load the script inside an iframe to
 * constrain the ad to 300×250 — position:fixed inside the iframe is relative
 * to the iframe viewport, not the parent page.
 */
export default function HilltopAdsEmbed({ scriptUrl, scriptUrlMobile }) {
  const isMobile = useIsMobile();
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const containerRef = useRef(null);

  const gender = profile?.gender;
  const enabled = config?.hilltopads_enabled;
  const showMen = config?.hilltopads_show_men !== false;
  const showWomen = config?.hilltopads_show_women || false;

  // Pick the active zone: mobile zone on mobile screens if available, else desktop
  const activeUrl = isMobile && scriptUrlMobile ? scriptUrlMobile : scriptUrl;

  const shouldRender =
    enabled &&
    activeUrl &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !activeUrl || !containerRef.current) return;

    // Clear any previous ad content — required for SPA page navigations.
    containerRef.current.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '300px';
    iframe.style.height = '250px';
    iframe.style.border = 'none';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    containerRef.current.appendChild(iframe);

    const fullUrl = activeUrl.startsWith('//') ? 'https:' + activeUrl : activeUrl;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      // Replicate the exact HilltopAds IIFE loader — the script expects
      // s.settings to be set and inserts itself at the last script's position.
      const loader =
        '(function(cn){' +
        'var d=document,s=d.createElement("script"),l=d.scripts[d.scripts.length-1];' +
        's.settings=cn||{};' +
        's.src="' + fullUrl + '";' +
        's.async=true;' +
        's.referrerPolicy="no-referrer-when-downgrade";' +
        'l.parentNode.insertBefore(s,l);' +
        '})({})';

      doc.open();
      doc.write(
        '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1">' +
        '<style>*{margin:0;padding:0;overflow:hidden;}html,body{width:300px;height:250px;}</style>' +
        '</head><body>' +
        '<script>' + loader + '<\/script>' +
        '</body></html>'
      );
      doc.close();
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [activeUrl, shouldRender]);

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