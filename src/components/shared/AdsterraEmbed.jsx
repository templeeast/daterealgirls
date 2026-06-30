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

  // Use srcdoc so the iframe inherits the parent origin — this avoids
  // ERR_SSL_PROTOCOL_ERROR caused by the null origin of about:blank iframes.
  const srcDoc =
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>body{margin:0;padding:0;overflow:hidden;}</style>' +
    '</head><body>' +
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