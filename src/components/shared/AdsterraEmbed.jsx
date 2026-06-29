import React, { useEffect } from 'react';
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

  const hash = scriptSrc ? scriptSrc.split('/').slice(-2, -1)[0] : null;
  const containerId = hash ? `container-${hash}` : null;

  useEffect(() => {
    if (!shouldRender || !scriptSrc || !containerId) return;
    const container = document.getElementById(containerId);
    if (!container) return;
    const script = document.createElement('script');
    script.src = scriptSrc.startsWith('//') ? 'https:' + scriptSrc : scriptSrc;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.appendChild(script);
    return () => {
      if (container) container.innerHTML = '';
    };
  }, [scriptSrc, shouldRender, containerId]);

  if (!shouldRender || !containerId) return null;

  return (
    <div className="my-4 flex justify-center">
      <div id={containerId} />
    </div>
  );
}