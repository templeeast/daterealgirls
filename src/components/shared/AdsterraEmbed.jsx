import React, { useEffect, useId } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdsterraEmbed({ scriptSrc }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const reactId = useId();
  const containerId = `adsterra-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const gender = profile?.gender;
  const enabled = config?.adsterra_enabled;
  const showMen = config?.adsterra_show_men !== false;
  const showWomen = config?.adsterra_show_women || false;

  const shouldRender =
    enabled &&
    scriptSrc &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !scriptSrc) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const fullSrc = scriptSrc.startsWith('//') ? 'https:' + scriptSrc : scriptSrc;
    const script = document.createElement('script');
    script.src = fullSrc;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [scriptSrc, shouldRender, containerId]);

  if (!shouldRender) return null;

  return (
    <div className="flex justify-center">
      <div id={containerId} style={{ minHeight: '90px', minWidth: '100%' }} />
    </div>
  );
}