import React, { useEffect, useMemo } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AdsterraEmbed({ scriptSrc, mode = 'banner', width = 728, height = 90 }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();

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

  // --- "pagefx" and "native" modes: inject script into document.head ---
  useEffect(() => {
    if (!shouldRender || !fullSrc || (mode !== 'native' && mode !== 'pagefx')) return;

    // Derive a unique script id from the URL so different placements don't collide
    const scriptId = 'adsterra-' + (fullSrc.match(/([a-f0-9]{8})/i)?.[1] || 'script');

    // Remove any previous injection with the same id (SPA re-mounts)
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = fullSrc;
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [fullSrc, shouldRender, mode]);

  // --- "banner" mode: iframe with atOptions ---
  const srcDoc = useMemo(() => {
    if (!fullSrc || mode !== 'banner') return '';
    const keyMatch = fullSrc.match(/([a-f0-9]{32})/i);
    const key = keyMatch ? keyMatch[1] : '';

    const atOptions = key
      ? "<script type='text/javascript'>" +
        "atOptions = {" +
        "'key' : '" + key + "'," +
        "'format' : 'iframe'," +
        "'height' : " + height + "," +
        "'width' : " + width + "," +
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
  }, [fullSrc, mode, width, height]);

  if (!shouldRender || !fullSrc) return null;

  // pagefx: no DOM element at all
  if (mode === 'pagefx') return null;

  // native: container div only (script injected into head by effect above)
  if (mode === 'native') {
    return <div className="my-4 w-full" style={{ minHeight: '90px' }} />;
  }

  // banner: iframe sized to exact width x height
  return (
    <div className="flex justify-center w-full my-4">
      <iframe
        srcDoc={srcDoc}
        title="ad"
        style={{ width: width + 'px', height: height + 'px', border: 'none', display: 'block' }}
      />
    </div>
  );
}