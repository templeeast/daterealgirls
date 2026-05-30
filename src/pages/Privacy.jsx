import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useSiteConfig from '@/hooks/useSiteConfig';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Privacy() {
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

        <h1 className="font-heading text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">We collect information you provide directly to us, such as when you create an account, complete your profile, or contact us for support. This includes your name, email address, date of birth, location, photos, and any other information you choose to provide.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use the information we collect to provide, maintain, and improve our services, to process transactions, to send you technical notices and support messages, and to respond to your comments and questions.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">3. Payment Information</h2>
            <p className="text-muted-foreground leading-relaxed">DateRealGirls does not store any credit card information or other payment data. All payment information is securely transmitted directly to our payment processors (Authorize.Net, PaymentCloud, or other third-party payment gateways). We never retain payment details on our servers. Only transaction confirmations and subscription status are stored locally.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">We do not sell, trade, or otherwise transfer your personal information to outside parties. Your profile information is visible to other registered members of the platform as part of the service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve your experience.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">7. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">You have the right to access, update, or delete your personal information at any time through your profile settings. You may also contact our support team for assistance.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">If you have questions about this Privacy Policy, please <Link to="/support" className="text-primary underline underline-offset-4">contact our support team</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}