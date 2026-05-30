import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSiteConfig from '@/hooks/useSiteConfig';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Terms() {
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

        <h1 className="font-heading text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">By accessing and using {config.site_name}, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">2. Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed">You must be at least 18 years of age to use this service. By using {config.site_name}, you represent and warrant that you are 18 years of age or older.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">3. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">You agree not to use the service to post or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable. You agree to treat other members with respect at all times.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">4. Account Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">5. Subscriptions and Payments</h2>
            <p className="text-muted-foreground leading-relaxed">Certain features of the service are available through a paid subscription. Subscription fees are billed in advance and are non-refundable except as required by law. You may cancel your subscription at any time.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">6. Content</h2>
            <p className="text-muted-foreground leading-relaxed">You retain ownership of content you post on the platform. By posting content, you grant us a non-exclusive license to use, display, and distribute that content in connection with our service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">7. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our sole discretion.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">If you have questions about these Terms, please <Link to="/support" className="text-primary underline underline-offset-4">contact our support team</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}