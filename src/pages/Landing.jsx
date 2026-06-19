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
        />
        {/* Mobile background — portrait image */}
        <div
          className="absolute inset-x-0 top-0 bg-cover bg-center bg-no-repeat sm:hidden"
          style={{ backgroundImage: "url('https://media.base44.com/images/public/6a075fa1d43a688621123d26/a18e6ab74_image.png')", bottom: '-320px' }}
        />
        {/* Subtle overlay — matches coming soon reference brightness */}
        <div className="absolute inset-x-0 top-0" style={{ bottom: '-320px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.48) 60%, hsl(30,25%,98%) 100%)' }} />

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
            <span className="font-heading font-bold text-2xl tracking-wide">
              <span className="text-white">Date</span><span className="text-primary">Real</span><span className="text-white">Girls</span>
            </span>
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

      {/* Token Pricing */}
      <section className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">{t('token_pricing_title')}</h2>
            <p className="text-muted-foreground text-lg">
              {config.first_purchase_bonus_men_enabled !== false
                ? t('token_pricing_subtitle_bonus_men', { n: (config.first_purchase_bonus_men_tokens ?? config.first_purchase_bonus_tokens ?? 5000).toLocaleString() })
                : t('token_pricing_subtitle_no_bonus')}
            </p>
          </div>

          {/* Token Packs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
            {[
              { nameKey: 'pack_starter_name', tokens: config.token_pack_starter_tokens ?? 500, price: config.token_pack_starter_price ?? 5.99, badge: null },
              { nameKey: 'pack_popular_name', tokens: config.token_pack_popular_tokens ?? 1500, price: config.token_pack_popular_price ?? 14.99, badgeKey: 'pack_badge_most_popular', highlight: true },
              { nameKey: 'pack_value_name', tokens: config.token_pack_value_tokens ?? 3500, price: config.token_pack_value_price ?? 29.99, badge: null },
              { nameKey: 'pack_best_name', tokens: config.token_pack_best_tokens ?? 8000, price: config.token_pack_best_price ?? 59.99, badgeKey: 'pack_badge_best_value' },
            ].map((pack) => (
              <div key={pack.nameKey} className={`bg-card border rounded-2xl p-6 text-center relative ${pack.highlight ? 'border-primary shadow-lg shadow-primary/10' : ''}`}>
                {pack.badgeKey && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {t(pack.badgeKey)}
                  </div>
                )}
                <div className="font-heading text-3xl font-bold mb-1 mt-2">{pack.tokens.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mb-1">{t('tokens_label')}</p>
                <div className="font-heading text-3xl font-bold text-primary mb-4">${pack.price}</div>
                <p className="text-xs text-muted-foreground mb-6">{t(pack.nameKey)}</p>
                <Button className="w-full rounded-full" size="sm" onClick={() => handleCTAClick('/my-profile')}>{t('get_started')}</Button>
              </div>
            ))}
          </div>

          {/* Cost Breakdown Table */}
          <div className="max-w-3xl mx-auto bg-card border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b bg-muted/30">
              <h3 className="font-heading text-lg font-semibold">{t('token_table_title')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20">
                    <th className="text-left px-6 py-3 font-medium">{t('token_table_action')}</th>
                    <th className="text-center px-4 py-3 font-medium">{t('browse_men')}</th>
                    <th className="text-center px-4 py-3 font-medium">{t('browse_women')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-6 py-3">{t('token_cost_browse_free', { n: config.tokens_free_browse_limit ?? 25 })}</td>
                    <td className="text-center px-4 py-3 text-green-600 font-medium">{t('free')}</td>
                    <td className="text-center px-4 py-3 text-green-600 font-medium">{t('free')}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-3">{t('token_cost_browse_all')}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens_week', { n: config.tokens_browse_cost_men ?? 100 })}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens', { n: config.tokens_browse_cost_women ?? 0 })}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-6 py-3">{t('token_cost_send_message')}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens', { n: config.tokens_msg_cost_men ?? 2 })}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens', { n: config.tokens_msg_cost_women ?? 0 })}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3">{t('id_verification')}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens', { n: config.tokens_verify_cost_men ?? 200 })}</td>
                    <td className="text-center px-4 py-3">{t('token_cost_n_tokens', { n: config.tokens_verify_cost_women ?? 200 })}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t bg-muted/20">
              <p className="text-xs text-muted-foreground text-center">{t('token_table_footer')}</p>
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