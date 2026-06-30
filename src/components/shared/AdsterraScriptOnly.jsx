import React, { useEffect } from 'react';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';

class AdsterraErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function AdsterraScriptOnlyInner({ scriptUrl, adUnitId }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();

  const enabled = config?.adsterra_enabled === true;
  const showMen = config?.adsterra_show_men !== false;
  const showWomen = config?.adsterra_show_women === true;
  const gender = profile?.gender;
  const audienceOk = !((gender === 'male' && !showMen) || (gender === 'female' && !showWomen));

  const fullUrl = scriptUrl
    ? (scriptUrl.startsWith('//') ? 'https:' + scriptUrl : scriptUrl)
    : '';

  useEffect(() => {
    if (!enabled || !audienceOk || !fullUrl) return;

    const scriptId = `adsterra-head-${adUnitId}`;
    // Prevent duplicate injection on SPA re-mounts
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.id = scriptId;
    script.src = fullUrl;
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [fullUrl, enabled, audienceOk, adUnitId]);

  return null;
}

export default function AdsterraScriptOnly(props) {
  return (
    <AdsterraErrorBoundary>
      <AdsterraScriptOnlyInner {...props} />
    </AdsterraErrorBoundary>
  );
}