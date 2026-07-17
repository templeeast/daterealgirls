import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useMyProfile from '@/hooks/useMyProfile';
import { useTranslation } from 'react-i18next';

/**
 * Compact promotional banner shown in place of the scrolling profiles banner
 * when the site hasn't reached the configured minimum member count yet.
 * Promotes the FIRST500 promo code — 3,000 free tokens for the first 500
 * verified members. Matches the height/spacing of the scrolling banner.
 */
export default function NewSitePromoBanner() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { profile } = useMyProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCTA = () => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    if (!profile || !profile.profile_complete) {
      navigate('/onboarding');
    } else {
      navigate('/my-profile');
    }
  };

  return (
    <section className="relative z-10 py-2 bg-secondary overflow-hidden border-y border-border">
      <div className="flex items-center gap-4 px-4 sm:px-6 max-w-6xl mx-auto min-h-[192px] sm:min-h-[240px]">
        <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/15">
          <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {t('new_site_promo_badge')}
          </span>
          <p className="text-lg sm:text-xl font-heading font-bold text-foreground mt-0.5">
            {t('new_site_promo_title', { tokens: '3,000', code: 'FIRST500' })}
          </p>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            {t('new_site_promo_desc_desktop')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
            {t('new_site_promo_desc_mobile')}
          </p>
          <p className="text-xs font-semibold text-primary mt-1.5">
            {t('new_site_promo_separate_note')}
          </p>
        </div>
        <Button
          className="flex-shrink-0 gap-1.5 rounded-full"
          onClick={handleCTA}
        >
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline">{isAuthenticated ? t('new_site_promo_btn_get_started') : t('new_site_promo_btn_sign_up')}</span>
          <span className="sm:hidden">{isAuthenticated ? t('new_site_promo_btn_start') : t('new_site_promo_btn_join')}</span>
        </Button>
      </div>
    </section>
  );
}