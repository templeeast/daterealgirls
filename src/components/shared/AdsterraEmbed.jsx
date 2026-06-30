import React, { useRef, useCallback } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdsterraEmbed({ scriptSrc }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const writtenRef = useRef(false);

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

  const keyMatch = fullSrc.match(/([a-f0-9]{32})/i);
  const key = keyMatch ? keyMatch[1] : '';

  const handleLoad = useCallback((e) => {
    if (writtenRef.current || !key || !fullSrc) return;
    const iframe = e.target;
    const doc = iframe.contentDocument;
    if (!doc) return;

    writtenRef.current = true;

    // Build the exact HTML Adsterra provides in their dashboard snippet.
    // Writing via doc.write ensures document.write calls inside invoke.js
    // target the iframe document, not the parent page.
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>body{margin:0;padding:0;}</style></head><body>' +
      '<script type="text/javascript">' +
      'atOptions = {' +
      "'key' : '" + key + "'," +
      "'format' : 'iframe'," +
      "'height' : 90," +
      "'width' : 728," +
      "'params' : {}" +
      '};' +
      '</' + 'script>' +
      '<script type="text/javascript" src="' + fullSrc + '" data-cfasync="false"></' + 'script>' +
      '</body></html>';

    doc.open();
    doc.write(html);
    doc.close();
  }, [key, fullSrc]);

  if (!shouldRender || !fullSrc) return null;

  // Reset for each new mount
  writtenRef.current = false;

  return (
    <div className="flex justify-center w-full my-4">
      <iframe
        onLoad={handleLoad}
        title="ad"
        style={{ width: '728px', maxWidth: '100%', minHeight: '90px', border: 'none', display: 'block' }}
      />
    </div>
  );
}