import React, { useRef, useEffect } from 'react';
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

  // Extract the 32-char hex key from the invoke.js URL
  const keyMatch = fullSrc.match(/([a-f0-9]{32})/i);
  const key = keyMatch ? keyMatch[1] : '';

  useEffect(() => {
    if (!shouldRender || !fullSrc || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Write directly to the iframe document — this ensures scripts that use
    // document.write (like Adsterra's invoke.js) execute in the correct order.
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8">');
    doc.write('<style>body{margin:0;padding:0;overflow:hidden;}</style>');
    doc.write('</head><body>');

    if (key) {
      doc.write('<script type="text/javascript">');
      doc.write('atOptions = {');
      doc.write('"key" : "' + key + '",');
      doc.write('"format" : "iframe",');
      doc.write('"height" : 90,');
      doc.write('"width" : 728,');
      doc.write('"params" : {}');
      doc.write('};');
      doc.write('</' + 'script>');
    }

    doc.write('<script type="text/javascript" src="' + fullSrc + '" data-cfasync="false"></' + 'script>');
    doc.write('</body></html>');
    doc.close();
  }, [fullSrc, shouldRender, key]);

  if (!shouldRender || !fullSrc) return null;

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