import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Shield, Users, Globe, ChevronRight, LogIn, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useSiteConfig from '@/hooks/useSiteConfig';
import ProfilesBelowHero from '@/components/landing/ProfilesBelowHero';
import StockProfilesBanner from '@/components/landing/StockProfilesBanner';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/layout/LanguageSelector';
import useMyProfile from '@/hooks/useMyProfile';

export default function Landing() {
  const { config } = useSiteConfig();
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();
  const { profile, isLoading: isLoadingProfile } = useMyProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleCTAClick = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigateToLogin();
    }
  };

  const features = [
    { icon: Heart, title: t('feature_real_connections_title'), desc: t('feature_real_connections_desc') },
    { icon: Globe, title: t('feature_global_reach_title'), desc: t('feature_global_reach_desc') },
    { icon: Shield, title: t('feature_id_verified_title'), desc: t('feature_id_verified_desc') },
  ];

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingProfile && isAuthenticated) {
      if (!profile) {
        navigate('/onboarding', { replace: true });
      } else if (!profile.profile_complete) {
        navigate('/my-profile', { replace: true });
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingProfile, profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Beta Banner */}
      {config.demo_mode && (
        <div className="w-full bg-primary text-primary-foreground py-3 px-4 text-center z-50 relative">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-base font-semibold">🚀 Beta Mode</span>
            <span className="text-sm text-primary-foreground/90">This app is currently in Beta — we're launching soon! Stay tuned for the full experience.</span>
          </div>
        </div>
      )}
      {/* Dev Mode Badge */}
      {config.dev_mode && (
        <div className="w-full bg-amber-500 text-white py-1.5 px-4 text-center z-50 relative">
          <span className="text-xs font-bold tracking-widest uppercase">⚙️ DEV MODE — Sandbox/Test Payment Keys Active</span>
        </div>
      )}

      {/* Hero — background extends into Features below */}
      <section className="relative overflow-visible">
        {/* Background photo — bikini women on beach, extends down */}
        {/* Desktop background */}
        <div
          className="absolute inset-x-0 top-0 bg-cover bg-no-repeat hidden sm:block"
          style={{ backgroundImage: "url('https://media.base44.com/images/public/6a075fa1d43a688621123d26/79fc46786_image.png')", backgroundPosition: 'center 20%', bottom: '-320px' }}
          style={{ bottom: '-320px' }}
        />
        {/* Mobile background — portrait image */}
        <div
          className="absolute inset-x-0 top-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: "url('https://media.base44.com/images/public/6a075fa1d43a688621123d26/a18e6ab74_image.png')", bottom: '-320px' }}
        />
        {/* Subtle overlay — matches coming soon reference brightness */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: '-320px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.32) 60%, hsl(30,25%,98%) 100%)' }} />

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <LanguageSelector />
          {isAuthenticated ? (
            <Link to="/my-profile">
              <Button size="sm" variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm gap-2">
                {profile?.photo_1 ? (
                  <img src={profile.photo_1} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <UserCircle className="w-4 h-4" />
                )}
                {profile?.display_name || t('my_profile') || 'My Profile'}
              </Button>
            </Link>
          ) : (
            <Button size="sm" variant="outline" onClick={navigateToLogin} className="bg-white/20 border-white/40 text-white hover:bg-white/30 backdrop-blur-sm gap-2">
              <LogIn className="w-4 h-4" />
              Login
            </Button>
          )}
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {/* Centered logo + site name — below top controls with enough margin to avoid overlap */}
          <div className="flex items-center justify-center gap-2 mt-10 mb-24">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-6 w-auto" />
            ) : (
              <Heart className="w-5 h-5 text-primary fill-primary" />
            )}
            <span className="font-heading font-bold text-white text-lg tracking-wide">{config.site_name}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="font-heading font-bold tracking-tight mb-6 drop-shadow-lg" style={{ fontSize: 'clamp(2.5rem, 7vw, 4.5rem)', lineHeight: 1.1 }}>
              <span className="text-white block">{t('tagline_line1').split(' ')[0]} <span style={{ color: '#F5A623' }}>{t('tagline_line1').split(' ').slice(1).join(' ')}</span></span>
              <span className="text-white block">{t('tagline_line2')}</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
              {t('hero_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto relative z-10 mb-16">
              <Button size="lg" className="text-lg px-8 py-6 gap-2 rounded-full" onClick={() => handleCTAClick('/browse')}>
                {t('btn_browse')}
                <ChevronRight className="w-5 h-5" />
              </Button>
              {!(isAuthenticated && profile?.profile_complete) && (
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20" onClick={() => handleCTAClick('/my-profile')}>
                  {!isAuthenticated ? t('get_started') : t('btn_complete_profile')}
                </Button>
              )}
            </div>

            {/* Feature cards — pushed lower, near bottom of hero image */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mt-24">
              {features.slice(0, 3).map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="p-6 rounded-2xl"
                  style={{ backgroundColor: 'rgba(35,22,18,0.55)', backdropFilter: 'blur(6px)' }}
                >
                  <div className="mb-4 inline-flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-base text-white mb-2.5">{f.title}</h3>
                  <p className="text-white/65 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Scrolling profiles banner */}
      <StockProfilesBanner />

      {/* Pricing */}
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{t('pricing_title')}</h2>
            <p className="text-muted-foreground text-lg">Easy signup, no upfront cost</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Women — always free */}
            <div className="bg-card border rounded-2xl p-8 text-center md:col-span-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                {t('for_women')}
              </div>
              <div className="font-heading text-5xl font-bold mb-2">{t('free')}</div>
              <p className="text-muted-foreground mb-6">{t('always_free')}</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('full_profile')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('unlimited_msg')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('browse_search')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('id_verification')}</li>
              </ul>
              <Button className="w-full rounded-full" size="lg" onClick={() => handleCTAClick('/my-profile')}>{t('get_started')}</Button>
            </div>

            {/* Men — Free tier */}
            <div className="bg-card border rounded-2xl p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-medium mb-4">
                Men — Free
              </div>
              <div className="font-heading text-5xl font-bold mb-2">$0</div>
              <p className="text-muted-foreground mb-6">Basic access, always free</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Create a profile</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Browse up to {config.free_tier_browse_limit ?? 25} profiles</li>
                <li className="flex items-center gap-2 text-muted-foreground line-through"><Heart className="w-4 h-4" /> Messaging</li>
                <li className="flex items-center gap-2 text-muted-foreground line-through"><Heart className="w-4 h-4" /> Unlimited browsing</li>
              </ul>
              <Button variant="outline" className="w-full rounded-full" size="lg" onClick={() => handleCTAClick('/my-profile')}>{t('get_started')}</Button>
            </div>

            {/* Men — Premium */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                {t('most_popular')}
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 mt-2">
                Men — Premium
              </div>
              <div className="font-heading text-5xl font-bold mb-2">${config.subscription_price || 9.99}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <div className="mb-6">
                <p className="text-muted-foreground mb-2">Full access, cancel anytime</p>
                <p className="text-sm bg-accent/60 text-accent-foreground px-3 py-2 rounded-lg font-medium">
                  {t('try_free_1_month')}
                </p>
              </div>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('full_profile')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('unlimited_msg')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('browse_search')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('id_verification')}</li>
              </ul>
              <Button className="w-full rounded-full" size="lg" onClick={() => handleCTAClick('/my-profile#subscription')}>{t('get_premium')}</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.site_name} className="h-6 w-auto" />
              ) : (
                <Heart className="w-5 h-5 text-primary fill-primary" />
              )}
              <span className="font-heading font-semibold">{config.site_name}</span>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground justify-center">
              <Link to="/support" className="hover:text-foreground transition-colors">{t('support')}</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">{t('contact_us_title')}</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">{t('privacy')}</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">{t('terms')}</Link>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {config.site_name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}