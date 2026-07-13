import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Determines whether any ads (JuicyAds or HilltopAds) would actually be
 * displayed for the current user on a given page, based on the page's
 * zone/script config and the user's gender + ad-free status.
 *
 * Mirrors the shouldRender logic in JuicyAdsEmbed and HilltopAdsEmbed.
 */
export default function useAdsActive({ juicyZone, juicyZoneMobile, hilltopUrl, hilltopUrlMobile }) {
  const { config } = useSiteConfig();
  const { profile } = useMyProfile();
  const isMobile = useIsMobile();

  const gender = profile?.gender;
  const adFreeUntil = profile?.ad_free_until;
  const isAdFree = adFreeUntil && new Date(adFreeUntil) > new Date();

  // --- JuicyAds ---
  const juicyActiveZone = (juicyZoneMobile && isMobile) ? juicyZoneMobile : juicyZone;
  const juicyActive =
    config?.juicyads_enabled &&
    juicyActiveZone &&
    !isAdFree &&
    !(gender === 'male' && config?.juicyads_show_men === false) &&
    !(gender === 'female' && !config?.juicyads_show_women);

  // --- HilltopAds ---
  const hilltopActiveUrl = (isMobile && hilltopUrlMobile) ? hilltopUrlMobile : hilltopUrl;
  const hilltopActive =
    config?.hilltopads_enabled &&
    hilltopActiveUrl &&
    !isAdFree &&
    !(gender === 'male' && config?.hilltopads_show_men === false) &&
    !(gender === 'female' && !config?.hilltopads_show_women);

  return juicyActive || hilltopActive;
}