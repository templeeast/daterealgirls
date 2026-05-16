import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Shield, Users, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useSiteConfig from '@/hooks/useSiteConfig';
import ProfileScrollBanner from '@/components/landing/ProfileScrollBanner';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Landing() {
  const { config } = useSiteConfig();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const features = [
    { icon: Shield, title: t('feature_id_verified_title'), desc: t('feature_id_verified_desc') },
    { icon: Users, title: t('feature_real_people_title'), desc: t('feature_real_people_desc') },
    { icon: Heart, title: t('feature_genuine_title'), desc: t('feature_genuine_desc') },
    { icon: Star, title: t('feature_safe_title'), desc: t('feature_safe_desc') },
  ];

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/browse', { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate]);

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

        {/* Language selector top-right */}
        <div className="absolute top-4 right-4 z-10">
          <LanguageSelector />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-white/20 text-white backdrop-blur-sm border border-white/30 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Shield className="w-4 h-4" />
              {t('badge_verified')}
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
              {config.tagline || t('tagline')}
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              {config.target_audience || t('target_audience')}
            </p>
            <ProfileScrollBanner />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="text-lg px-8 py-6 gap-2 rounded-full">
                  {t('btn_browse')}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/my-profile">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full">
                  {t('btn_complete_profile')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/40 rounded-full blur-3xl" />
      </section>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Women */}
            <div className="bg-card border rounded-2xl p-8 text-center">
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
              <Link to="/my-profile">
                <Button className="w-full rounded-full" size="lg">{t('get_started')}</Button>
              </Link>
            </div>
            {/* Men */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                {t('months_free', { n: config.trial_duration_months })}
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 mt-2">
                {t('for_men')}
              </div>
              <div className="font-heading text-5xl font-bold mb-2">${config.subscription_price}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-muted-foreground mb-6">{t('after_trial', { n: config.trial_duration_months })}</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('full_profile')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('unlimited_msg')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('browse_search')}</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> {t('id_verification')}</li>
              </ul>
              <Link to="/my-profile">
                <Button className="w-full rounded-full" size="lg">{t('start_trial')}</Button>
              </Link>
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
              <span>{t('privacy')}</span>
              <span>{t('terms')}</span>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {config.site_name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}