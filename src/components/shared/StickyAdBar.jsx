import React from 'react';
import JuicyAdsEmbed from '@/components/shared/JuicyAdsEmbed';

/**
 * Renders a JuicyAds ad unit pinned in a sticky bar below the navbar,
 * so it stays visible while the user scrolls the page.
 */
export default function StickyAdBar({ zone, zoneMobile }) {
  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto">
        <JuicyAdsEmbed zone={zone} zoneMobile={zoneMobile} />
      </div>
    </div>
  );
}