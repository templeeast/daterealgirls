import React from 'react';
import HilltopAdsEmbed from '@/components/shared/HilltopAdsEmbed';

/**
 * Renders a HilltopAds ad unit pinned in a sticky bar below the navbar,
 * so it stays visible while the user scrolls the page.
 */
export default function HilltopAdBar({ scriptUrl, scriptUrlMobile }) {
  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto">
        <HilltopAdsEmbed scriptUrl={scriptUrl} scriptUrlMobile={scriptUrlMobile} />
      </div>
    </div>
  );
}