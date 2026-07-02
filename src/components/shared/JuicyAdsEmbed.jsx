import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JuicyAdsEmbed({ zone, zoneMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();
  const iframeRef = useRef(null);

  const activeZone = (zoneMobile && isMobile) ? zoneMobile : zone;

  const gender = profile?.gender;
  const enabled = config?.juicyads_enabled;
  const showMen = config?.juicyads_show_men !== false;
  const showWomen = config?.juicyads_show_women || false;

  const shouldRender =
    enabled &&
    activeZone &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !activeZone) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    // Write the JuicyAds embed into an isolated iframe document.
    // This gives jads.js a fresh context each mount — it properly
    // discovers the <ins> element and renders the full zone config
    // (including multi-column layout) without SPA caching issues.
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; overflow: hidden; }
          ins { display: block !important; width: 100% !important; }
        </style>
      </head>
      <body>
        <ins class="adsbyjuicy" data-adzone="${activeZone}"></ins>
        <script type="text/javascript" data-cfasync="false" src="https://adserver.juicyads.com/js/jads.js"></script>
        <script type="text/javascript">
          // Auto-resize iframe to fit rendered ad content
          function resize() {
            var h = document.body.scrollHeight;
            if (h > 0) {
              window.frameElement.style.height = h + 'px';
            }
          }
          if (window.MutationObserver) {
            var obs = new MutationObserver(resize);
            obs.observe(document.body, { childList: true, subtree: true, attributes: true });
          }
          setInterval(resize, 500);
          window.addEventListener('load', resize);
        </script>
      </body>
      </html>
    `);
    doc.close();
  }, [activeZone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 w-full flex justify-center">
      <iframe
        ref={iframeRef}
        title="Advertisement"
        style={{ width: '100%', minHeight: '250px', border: '0', display: 'block' }}
        scrolling="no"
      />
    </div>
  );
}