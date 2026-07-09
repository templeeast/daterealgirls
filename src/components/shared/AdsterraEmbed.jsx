import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders an Adsterra banner ad unit.
 *
 * Mirrors the JuicyAdsEmbed pattern: checks config + gender audience,
 * picks the desktop or mobile key, and injects the Adsterra invoke.js
 * script into a container div.
 *
 * Recommended banner sizes (from Adsterra available sizes):
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

    // Adsterra uses a global atOptions object read by invoke.js
    window.atOptions = {
      key: activeKey,
      format: 'iframe',
      height: activeHeight,
      width: activeWidth,
      params: {},
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://www.highperformanceformat.com/${activeKey}/invoke.js`;
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