import React from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdsterraEmbed({ scriptSrc }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();

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

  if (!shouldRender || !fullSrc) return null;

  // Adsterra invoke.js ads require atOptions to be set BEFORE the script loads.
  // Without it, the script redirects to a fallback domain (effectivecontentnetwork.com)
  // that has SSL issues. We extract the 32-char hex key from the URL and build atOptions.
  const isInvokeJs = fullSrc.includes('invoke.js');
  const keyMatch = fullSrc.match(/([a-f0-9]{32})/i);
  const key = keyMatch ? keyMatch[1] : '';

  const atOptionsScript =
    isInvokeJs && key
      ? '<script type="text/javascript">' +
        'atOptions = {' +
        '"key" : "' + key + '",' +
        '"format" : "iframe",' +
        '"height" : 90,' +
        '"width" : 728,' +
        '"params" : {}' +
        '};' +
        '<\/script>'
      : '';

  const srcDoc =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>body{margin:0;padding:0;}</style>' +
    '</head><body>' +
    atOptionsScript +
    '<script type="text/javascript" src="' + fullSrc + '" data-cfasync="false"><\/script>' +
    '</body></html>';

  return (
    <div className="flex justify-center w-full">
      <iframe
        srcDoc={srcDoc}
        title="ad"
        style={{ width: '100%', minHeight: '100px', border: 'none', display: 'block' }}
      />
    </div>
  );
}