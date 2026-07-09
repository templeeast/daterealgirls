import React from 'react';
import JuicyAdsEmbed from '@/components/shared/JuicyAdsEmbed';
import AdsterraEmbed from '@/components/shared/AdsterraEmbed';

/**
 * Renders ad units pinned in a sticky bar below the navbar,
 * so they stay visible while the user scrolls the page.
 * Supports both JuicyAds and Adsterra — each renders only if its
 * respective config key/zone is provided and enabled.
 */
export default function StickyAdBar({ zone, zoneMobile, adsterraKey, adsterraKeyMobile }) {
  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto">
        <JuicyAdsEmbed zone={zone} zoneMobile={zoneMobile} />
        <AdsterraEmbed adKey={adsterraKey} adKeyMobile={adsterraKeyMobile} />
      </div>
    </div>
  );
}