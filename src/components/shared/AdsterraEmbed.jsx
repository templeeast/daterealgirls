import React, { useMemo } from 'react';
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

  // srcDoc gives the iframe the parent page's origin, so relative URLs
  // in ad creatives resolve correctly (unlike about:blank from doc.write).
  const srcDoc = useMemo(() => {
    if (!fullSrc) return '';
    const keyMatch = fullSrc.match(/([a-f0-9]{32})/i);
    const key = keyMatch ? keyMatch[1] : '';

    // Build the exact snippet format Adsterra provides in their dashboard
    const atOptions = key
      ? "<script type='text/javascript'>" +
        "atOptions = {" +
        "'key' : '" + key + "'," +
        "'format' : 'iframe'," +
        "'height' : 90," +
        "'width' : 728," +
        "'params' : {}" +
        "};" +
        "<\/script>"
      : '';

    return "<!DOCTYPE html><html><head><meta charset='utf-8'>" +
      "<style>html,body{margin:0;padding:0;}</style>" +
      "</head><body>" +
      atOptions +
      "<script type='text/javascript' src='" + fullSrc + "' data-cfasync='false'><\/script>" +
      "</body></html>";
  }, [fullSrc]);

  if (!shouldRender || !fullSrc) return null;

  return (
    <div className="flex justify-center w-full my-4">
      <iframe
        srcDoc={srcDoc}
        title="ad"
        style={{ width: '728px', maxWidth: '100%', minHeight: '90px', border: 'none', display: 'block' }}
      />
    </div>
  );
}