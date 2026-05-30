import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSiteConfig from '@/hooks/useSiteConfig';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function ShippingPolicy() {
  const { t } = useTranslation();
  const { config } = useSiteConfig();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </Link>
          <LanguageSelector />
        </div>

        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="font-heading font-semibold">{config.site_name}</span>
        </div>

        <h1 className="font-heading text-4xl font-bold mb-2">{t('shipping_policy_title')}</h1>
        <p className="text-muted-foreground mb-10">{t('last_updated')}: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">1. {t('shipping_digital_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('shipping_digital_desc', { siteName: config.site_name })}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">2. {t('shipping_delivery_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('shipping_delivery_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">3. {t('shipping_access_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('shipping_access_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">4. {t('shipping_issues_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('shipping_issues_desc')}{' '}
              <Link to="/contact" className="text-primary underline underline-offset-4">{t('contact_us_title')}</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}