import React, { useEffect } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

export default function AdMavenEmbed() {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();

  const gender = profile?.gender;
  const enabled = config?.admaven_enabled;
  const showMen = config?.admaven_show_men !== false;
  const showWomen = config?.admaven_show_women || false;
  const scriptSrc = config?.admaven_push_script;

  const shouldRender =
    enabled &&
    scriptSrc &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  useEffect(() => {
    if (!shouldRender || !scriptSrc) return;

    // Avoid duplicate injection on SPA re-renders
    if (document.getElementById('admaven-push-loader')) return;

    const loader = document.createElement('script');
    loader.id = 'admaven-push-loader';
    loader.type = 'text/javascript';
    loader.async = true;
    loader.src = scriptSrc;
    document.head.appendChild(loader);
  }, [shouldRender, scriptSrc]);

  return null;
}