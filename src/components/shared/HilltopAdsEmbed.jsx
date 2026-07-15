import React, { useState, useEffect } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Renders a HilltopAds 300×250 banner ad inside an iframe.
 *
 * scriptUrl       — s.src for the desktop zone.
 * scriptUrlMobile — s.src for the mobile-mode zone (optional).
 *
 * Uses lazy initial state for mobile detection (not the useIsMobile hook)
 * to get the correct value on the FIRST render — no undefined→true flash
 * that would cause the iframe to load the desktop URL briefly then switch.
 * A `key` prop on the iframe forces a clean iframe recreation when the URL
 * changes, guaranteeing the browser reloads the ad.
 */
export default function HilltopAdsEmbed({ scriptUrl, scriptUrlMobile }) {
  // Lazy initial state — correct on first render, no timing gap
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

  const c1 = Boolean(enabled);
  const c2 = Boolean(activeUrl);
  const c3 = Boolean(!isAdFree);
  const c4 = Boolean(!genderBlocked);
  const shouldRender = c1 && c2 && c3 && c4;

  // Debug trace — remove after resolving
  console.log('[HilltopAdsEmbed] conditions', {
    c1_enabled: c1,
    c2_activeUrl: c2,
    c3_notAdFree: c3,
    c4_notGenderBlocked: c4,
    shouldRender,
    isAdFree_type: typeof isAdFree,
    isAdFree_val: isAdFree,
    activeUrl_type: typeof activeUrl,
    activeUrl_len: activeUrl ? activeUrl.length : 0,
  });

  if (!shouldRender) return null;

  // HilltopAds code blocks display s.src with escaped slashes (\/).
  // Strip backslashes so the URL becomes a clean //loud-hall.com/... value.
  const cleanUrl = activeUrl.replace(/\\/g, '');
  const fullUrl = cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl;

  const srcDoc =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="referrer" content="no-referrer-when-downgrade">' +
    '<style>*{margin:0;padding:0;overflow:hidden;}html,body{width:' + width + 'px;height:' + height + 'px;}</style>' +
    '</head><body>' +
    '<script>(function(cn){' +
    'var d=document,s=d.createElement("script"),l=d.scripts[d.scripts.length-1];' +
    's.settings=cn||{};' +
    's.src="' + fullUrl + '";' +
    's.async=true;' +
    's.referrerPolicy="no-referrer-when-downgrade";' +
    'l.parentNode.insertBefore(s,l);' +
    '})({})<\/script>' +
    '</body></html>';

  return (
    <div className="my-4 flex justify-center">
      <iframe
        key={fullUrl}
        srcDoc={srcDoc}
        title="advertisement"
        style={{ width: width + 'px', height: height + 'px', border: 'none', display: 'block', margin: '0 auto' }}
        scrolling="no"
        frameBorder="0"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}