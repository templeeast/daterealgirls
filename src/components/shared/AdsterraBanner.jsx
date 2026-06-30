import React, { useEffect, useRef } from 'react';
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

function AdsterraBannerInner({ scriptUrl, adUnitId, width, height, isMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const containerRef = useRef(null);

  const enabled = config?.adsterra_enabled === true;
  const showMen = config?.adsterra_show_men !== false;
  const showWomen = config?.adsterra_show_women === true;
  const gender = profile?.gender;
  const audienceOk = !((gender === 'male' && !showMen) || (gender === 'female' && !showWomen));

  const fullUrl = scriptUrl
    ? (scriptUrl.startsWith('//') ? 'https:' + scriptUrl : scriptUrl)
    : '';

  useEffect(() => {
    if (!enabled || !audienceOk || !fullUrl || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    // invoke.js reads atOptions to know which ad zone + dimensions to render
    const keyMatch = fullUrl.match(/([a-f0-9]{32})/i);
    const key = keyMatch ? keyMatch[1] : '';
    if (key) {
      window.atOptions = {
        key: key,
        format: 'iframe',
        height: height,
        width: width,
        params: {}
      };
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.id = `adsterra-script-${adUnitId}`;
    script.src = fullUrl;
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [fullUrl, enabled, audienceOk, adUnitId, width, height]);

  if (!enabled || !audienceOk || !fullUrl) return null;

  return (
    <div
      ref={containerRef}
      id={`adsterra-${adUnitId}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        maxWidth: '100%',
        margin: '0 auto',
        overflow: 'hidden',
      }}
    />
  );
}

export default function AdsterraBanner(props) {
  return (
    <AdsterraErrorBoundary>
      <AdsterraBannerInner {...props} />
    </AdsterraErrorBoundary>
  );
}