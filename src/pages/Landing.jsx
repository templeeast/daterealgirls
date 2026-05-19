import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Shield, Users, Star, ChevronRight, LogIn, UserCircle } from 'lucide-react';
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
    { icon: Shield, title: t('feature_id_verified_title'), desc: t('feature_id_verified_desc') },
    { icon: Users, title: t('feature_real_people_title'), desc: t('feature_real_people_desc') },
    { icon: Heart, title: t('feature_genuine_title'), desc: t('feature_genuine_desc') },
    { icon: Star, title: t('feature_safe_title'), desc: t('feature_safe_desc') },
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background photo — bikini women on beach */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://media.base44.com/images/public/6a075fa1d43a688621123d26/79fc46786_image.png')" }}
        />
        {/* Dark gradient overlay to keep text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />

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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-medium mb-8">
              {t('badge_verified')}
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
              {t('tagline')}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('hero_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto relative z-10">
              <Button size="lg" className="text-lg px-8 py-6 gap-2 rounded-full" onClick={() => handleCTAClick('/browse')}>
                {t('btn_browse')}
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full bg-white/10 border-white/40 text-white hover:bg-white/20" onClick={() => handleCTAClick('/my-profile')}>
                {t('btn_complete_profile')}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/40 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Scrolling profiles banner */}
      <StockProfilesBanner />

      {/* Features */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{t('why_title', { siteName: config.site_name })}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('why_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{t('pricing_title')}</h2>
            <p className="text-muted-foreground text-lg">{t('pricing_subtitle')}</p>
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
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Browse up to {config.free_tier_browse_limit || 5} profiles</li>
                <li className="flex items-center gap-2 text-muted-foreground line-through"><Heart className="w-4 h-4" /> Messaging</li>
                <li className="flex items-center gap-2 text-muted-foreground line-through"><Heart className="w-4 h-4" /> Unlimited browsing</li>
              </ul>
              <Button variant="outline" className="w-full rounded-full" size="lg" onClick={() => handleCTAClick('/my-profile')}>{t('get_started')}</Button>
            </div>

            {/* Men — Premium */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 mt-2">
                Men — Premium
              </div>
              <div className="font-heading text-5xl font-bold mb-2">${config.subscription_price || 9.99}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-muted-foreground mb-6">Full access, cancel anytime</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('full_profile')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('unlimited_msg')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('browse_search')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('id_verification')}</li>
              </ul>
              <Button className="w-full rounded-full" size="lg" onClick={() => handleCTAClick('/my-profile')}>Get Premium</Button>
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
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/support" className="hover:text-foreground transition-colors">{t('support')}</Link>
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