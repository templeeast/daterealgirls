import React from 'react';
import JuicyAdsEmbed from '@/components/shared/JuicyAdsEmbed';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Renders a JuicyAds ad unit pinned in a sticky bar below the navbar,
 * so it stays visible while the user scrolls the page.
 * Returns null entirely when the ad would not render (no zone, ads disabled,
 * or gender-filtered) so no empty bar is left behind.
 */
export default function StickyAdBar({ zone, zoneMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();

  const activeZone = (zoneMobile && isMobile) ? zoneMobile : zone;
  const gender = profile?.gender;
  const enabled = config?.juicyads_enabled;
  const showMen = config?.juicyads_show_men !== false;
  const showWomen = config?.juicyads_show_women || false;

  const shouldRender =
    enabled &&
    activeZone &&
    !(gender === 'male' && !showMen) &&
    !(gender === 'female' && !showWomen);

  if (!shouldRender) return null;

  return (
    <div className="sticky top-16 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto">
        <JuicyAdsEmbed zone={zone} zoneMobile={zoneMobile} />
      </div>
    </div>
  );
}