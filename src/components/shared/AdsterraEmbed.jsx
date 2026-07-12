import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders an Adsterra banner ad unit.
 *
 * Uses the standard React integration pattern: appends a config
 * script (setting atOptions) and the invoke.js script directly to
 * the container div. invoke.js inserts the ad iframe next to the
 * script element inside the container — no document.write override
 * or iframe wrapper needed.
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

    // Standard Adsterra React integration: append a config script that
    // sets atOptions, then append invoke.js. invoke.js reads atOptions
    // and inserts the ad iframe next to the script element (inside our
    // container). No document.write override or iframe wrapper needed.
    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.innerHTML = 'atOptions = ' + JSON.stringify({
      key: activeKey,
      format: 'iframe',
      height: activeHeight,
      width: activeWidth,
      params: {}
    }) + ';';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/' + activeKey + '/invoke.js';

    container.appendChild(conf);
    container.appendChild(script);

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