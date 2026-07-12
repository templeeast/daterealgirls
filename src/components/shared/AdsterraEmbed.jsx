import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders an Adsterra banner ad unit.
 *
 * Loads invoke.js as a first-party script (not inside an iframe) and
 * intercepts document.write — which invoke.js uses to output the ad
 * iframe tag. In an SPA the document is already closed so native
 * document.write is blocked; our override captures the HTML and
 * injects it into our container div.
 *
 * This approach works on iOS Safari, where iframe-based methods
 * (srcdoc, blob URL) fail due to Intelligent Tracking Prevention
 * blocking third-party scripts inside iframes.
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

    // Set atOptions on window — invoke.js reads this global
    window.atOptions = {
      key: activeKey,
      format: 'iframe',
      height: activeHeight,
      width: activeWidth,
      params: {}
    };

    // invoke.js uses document.write to output the ad iframe tag.
    // In an SPA the document is already closed, so native document.write
    // is blocked by the browser. Override it to capture the output,
    // then inject it into our container. Loading as a first-party
    // script avoids iOS Safari's ITP blocking that affects iframes.
    const origWrite = document.write.bind(document);
    const origWriteln = document.writeln.bind(document);
    let captured = '';

    document.write = (h) => { captured += h; };
    document.writeln = (h) => { captured += h; };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/' + activeKey + '/invoke.js';

    script.onload = () => {
      document.write = origWrite;
      document.writeln = origWriteln;
      if (captured) {
        container.innerHTML = captured;
      }
    };

    script.onerror = () => {
      document.write = origWrite;
      document.writeln = origWriteln;
    };

    container.appendChild(script);

    return () => {
      document.write = origWrite;
      document.writeln = origWriteln;
      container.innerHTML = '';
      if (window.atOptions && window.atOptions.key === activeKey) {
        delete window.atOptions;
      }
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