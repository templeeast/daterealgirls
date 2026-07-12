import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders an Adsterra banner ad unit.
 *
 * Sets the atOptions global and loads Adsterra's invoke.js directly.
 * With format:'iframe', invoke.js creates its own internal iframe to
 * render the ad — no wrapper iframe needed, works on all platforms
 * including iOS Safari.
 *
 * Recommended banner sizes:
 *   Desktop: 728x90 (Leaderboard)
 *   Mobile:  320x50 (Mobile Banner)
 */
export default function AdsterraEmbed({
  adKey,
  adKeyMobile,
  width = 728,
  height = 90,
  mobileWidth = 320,
  mobileHeight = 50,
}) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();
  const containerRef = useRef(null);

  const usingMobileKey = !!(adKeyMobile && isMobile);
  const activeKey = usingMobileKey ? adKeyMobile : adKey;
  const activeWidth = usingMobileKey ? mobileWidth : width;
  const activeHeight = usingMobileKey ? mobileHeight : height;

  const gender = profile?.gender;
  const enabled = config?.adsterra_enabled;
  const showMen = config?.adsterra_show_men !== false;
  const showWomen = config?.adsterra_show_women || false;

  const shouldRender =
    enabled &&
    activeKey &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !activeKey || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // invoke.js uses document.write, which on an SPA would wipe the entire
    // page. We must isolate it inside an iframe so document.write only
    // affects the iframe's document.
    const iframe = document.createElement('iframe');
    iframe.width = activeWidth;
    iframe.height = activeHeight;
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';
    iframe.scrolling = 'no';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('loading', 'eager');

    const srcdoc =
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style>' +
      '</head><body>' +
      '<script type="text/javascript">' +
      'atOptions = {' +
      "'key': '" + activeKey + "'," +
      "'format': 'iframe'," +
      "'height': " + activeHeight + "," +
      "'width': " + activeWidth + "," +
      "'params': {}" +
      '};' +
      '</' + 'script>' +
      '<script type="text/javascript" src="https://www.highperformanceformat.com/' + activeKey + '/invoke.js"></' + 'script>' +
      '</body></html>';

    iframe.setAttribute('srcdoc', srcdoc);
    container.appendChild(iframe);

    return () => {
      container.innerHTML = '';
    };
  }, [activeKey, shouldRender, activeWidth, activeHeight]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <div
        ref={containerRef}
        style={{ minHeight: `${activeHeight}px`, minWidth: `${activeWidth}px` }}
      />
    </div>
  );
}