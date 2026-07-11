import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders an Adsterra banner ad unit.
 *
 * Uses an iframe wrapper so Adsterra's invoke.js (which relies on
 * document.write) has a fresh document context — this is required
 * for SPAs where scripts are injected after initial page load,
 * and fixes rendering on iOS Safari.
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

    // Use srcdoc so the iframe content is parsed natively by the browser.
    // iOS Safari silently fails when writing to contentWindow.document on
    // a programmatically created iframe; srcdoc avoids that entirely.
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
      '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;overflow:hidden;}</style></head><body>' +
      '<script type="text/javascript">' +
      'atOptions = {' +
      "  key: '" + activeKey + "'," +
      "  format: 'iframe'," +
      '  height: ' + activeHeight + ',' +
      '  width: ' + activeWidth + ',' +
      '  params: {}' +
      '};' +
      '</script>' +
      '<script type="text/javascript" src="https://www.highperformanceformat.com/' + activeKey + '/invoke.js"></script>' +
      '</body></html>';

    // srcdoc is well-supported on iOS Safari 5+ and all modern browsers;
    // it avoids the contentWindow.document.write timing failures on iOS
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