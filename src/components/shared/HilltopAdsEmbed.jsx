import React from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders a HilltopAds 300×250 banner ad inside a sandboxed iframe.
 *
 * scriptUrl       — s.src for the desktop zone.
 * scriptUrlMobile — s.src for the mobile-mode zone (optional).
 *
 * On mobile screens, the mobile zone is used if set; otherwise falls back
 * to the desktop zone.
 *
 * Uses a React-rendered <iframe srcDoc=...> so the browser handles iframe
 * lifecycle natively — no manual doc.write() or useEffect cleanup needed.
 * When the active URL changes (e.g. desktop→mobile switch), React updates
 * srcDoc and the browser reloads the iframe content reliably.
 */
export default function HilltopAdsEmbed({ scriptUrl, scriptUrlMobile }) {
  const isMobile = useIsMobile();
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();

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

  if (!shouldRender) return null;

  // HilltopAds code blocks display s.src with escaped slashes (\/). When
  // copy-pasted into the admin form, backslashes are stored literally.
  // Strip them so the URL becomes a clean //loud-hall.com/... value.
  const cleanUrl = activeUrl.replace(/\\/g, '');
  const fullUrl = cleanUrl.startsWith('//') ? 'https:' + cleanUrl : cleanUrl;

  // Replicate the exact HilltopAds IIFE loader inside the iframe document.
  const srcDoc =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>*{margin:0;padding:0;overflow:hidden;}html,body{width:300px;height:250px;}</style>' +
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
        srcDoc={srcDoc}
        title="advertisement"
        style={{ width: '300px', height: '250px', border: 'none', display: 'block', margin: '0 auto' }}
        scrolling="no"
        frameBorder="0"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}