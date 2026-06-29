import React, { useEffect } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function JuicyAdsEmbed({ zone }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();

  const gender = profile?.gender;
  const enabled = config?.juicyads_enabled;
  const showMen = config?.juicyads_show_men !== false;
  const showWomen = config?.juicyads_show_women || false;

  const shouldRender =
    enabled &&
    zone &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender) return;
    const script = document.createElement('script');
    script.src = `https://cdn.juicyads.com/jp.js?t=${zone}`;
    script.async = true;
    const container = document.getElementById(`juicyads-embed-${zone}`);
    if (container) container.appendChild(script);
    return () => {
      if (container) container.innerHTML = '';
    };
  }, [zone, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className="my-4 flex justify-center">
      <div id={`juicyads-embed-${zone}`} />
    </div>
  );
}