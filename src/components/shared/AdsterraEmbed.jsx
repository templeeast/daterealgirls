import React, { useEffect, useRef } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdsterraEmbed({ scriptSrc }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const iframeRef = useRef(null);

  const gender = profile?.gender;
  const enabled = config?.adsterra_enabled;
  const showMen = config?.adsterra_show_men !== false;
  const showWomen = config?.adsterra_show_women || false;

  const shouldRender =
    enabled &&
    scriptSrc &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  const fullSrc = scriptSrc
    ? (scriptSrc.startsWith('//') ? 'https:' + scriptSrc : scriptSrc)
    : '';

  useEffect(() => {
    if (!shouldRender || !fullSrc || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Write the ad script into the iframe so document.write() calls
    // inside the Adsterra script render into the iframe, not the host page.
    doc.open();
    doc.write(
      '<html><head><style>body{margin:0;padding:0;}</style></head><body>' +
      '<script type="text/javascript" src="' + fullSrc + '" data-cfasync="false"><\/script>' +
      '</body></html>'
    );
    doc.close();
  }, [fullSrc, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="flex justify-center w-full">
      <iframe
        ref={iframeRef}
        title="ad"
        style={{ width: '100%', minHeight: '100px', border: 'none', display: 'block' }}
      />
    </div>
  );
}