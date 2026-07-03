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

        <h1 className="font-heading text-4xl font-bold mb-1">{t('terms_page_title')}</h1>
        <p className="text-sm text-muted-foreground mb-1">{t('terms_operated_by')}</p>
        <p className="text-muted-foreground mb-2">{t('terms.header.last_revised')}</p>
        <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-10 leading-relaxed">
          {t('terms_arbitration_notice')}
        </p>

        <div className="prose prose-sm max-w-none space-y-10 text-foreground">

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">1. {t('terms_s1_title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">{t('terms_s1_p1', { siteName: config.site_name })}</p>
            <p className="text-muted-foreground leading-relaxed mb-3">{t('terms_s1_p2')}</p>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s1_incorporated')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-3">
              <li>{t('terms_s1_inc_privacy')}</li>
              <li>{t('terms_s1_inc_cookie')}</li>
              <li>{t('terms_s1_inc_payment')}</li>
              <li>{t('terms_s1_inc_misconduct')}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s1_updates')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">2. {t('terms_s2_title')}</h2>
            <h3 className="font-semibold mb-2">2.1 {t('terms_s2_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s2_1_desc')}</p>
            <h3 className="font-semibold mb-2">2.2 {t('terms_s2_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s2_2_desc')}</p>
            <h3 className="font-semibold mb-2">2.3 {t('terms_s2_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s2_3_intro')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>{t('terms_s2_3_a')}</li>
              <li>{t('terms_s2_3_b')}</li>
              <li>{t('terms_s2_3_c')}</li>
              <li>{t('terms_s2_3_d')}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s2_3_violation')}</p>
            <h3 className="font-semibold mb-2">2.4 {t('terms_s2_4_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s2_4_desc')}</p>
            <h3 className="font-semibold mb-2">2.5 {t('terms_s2_5_title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s2_5_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">3. {t('terms_s3_title')}</h2>
            <h3 className="font-semibold mb-2">3.1 {t('terms_s3_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s3_1_intro')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>{t('terms_s3_1_women')}</li>
              <li>{t('terms_s3_1_men')}</li>
            </ul>
            <h3 className="font-semibold mb-2">3.2 {t('terms_s3_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s3_2_desc')}</p>
            <h3 className="font-semibold mb-2">3.3 {t('terms_s3_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s3_3_desc')}</p>
            <h3 className="font-semibold mb-2">3.4 {t('terms_s3_4_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s3_4_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">4. {t('terms_s4_title')}</h2>
            <h3 className="font-semibold mb-2">4.1 {t('terms_s4_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s4_1_desc')}</p>
            <h3 className="font-semibold mb-2">4.2 {t('terms_s4_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s4_2_intro')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-3">
              <li>{t('terms_s4_2_a')}</li>
              <li>{t('terms_s4_2_b')}</li>
              <li>{t('terms_s4_2_c')}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s4_2_submit')}</p>
            <h3 className="font-semibold mb-2">4.3 {t('terms_s4_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s4_3_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">5. {t('terms_s5_title')}</h2>
            <h3 className="font-semibold mb-2">5.1 {t('terms_s5_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s5_1_intro')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>{t('terms_s5_1_a')}</li>
              <li>{t('terms_s5_1_b')}</li>
              <li>{t('terms_s5_1_c')}</li>
              <li>{t('terms_s5_1_d')}</li>
              <li>{t('terms_s5_1_e')}</li>
            </ul>
            <h3 className="font-semibold mb-2">5.2 {t('terms_s5_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s5_2_intro')}</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground mb-4">
              <li>{t('terms_s5_2_a')}</li>
              <li>{t('terms_s5_2_b')}</li>
              <li>{t('terms_s5_2_c')}</li>
              <li>{t('terms_s5_2_d')}</li>
              <li>{t('terms_s5_2_e')}</li>
              <li>{t('terms_s5_2_f')}</li>
              <li>{t('terms_s5_2_g')}</li>
              <li>{t('terms_s5_2_h')}</li>
              <li>{t('terms_s5_2_i')}</li>
              <li>{t('terms_s5_2_j')}</li>
            </ul>
            <h3 className="font-semibold mb-2">5.3 {t('terms_s5_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s5_3_desc')}</p>
            <h3 className="font-semibold mb-2">5.4 {t('terms_s5_4_title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s5_4_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">6. {t('terms_s6_title')}</h2>
            <h3 className="font-semibold mb-2">6.1 {t('terms_s6_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s6_1_desc')}</p>
            <h3 className="font-semibold mb-2">6.2 {t('terms_s6_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s6_2_desc')}</p>
            <h3 className="font-semibold mb-2">6.3 {t('terms_s6_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s6_3_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">7. {t('terms_s7_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s7_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">8. {t('terms_s8_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s8_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">{t('terms.section_8a.title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.intro')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a1.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a1.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a2.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a2.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a3.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a3.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a4.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a4.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a5.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a5.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a6.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4 uppercase text-sm font-medium">{t('terms.section_8a.8a6.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a7.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a7.body')}</p>
            <h3 className="font-semibold mb-2">{t('terms.section_8a.8a8.heading')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_8a.8a8.body')}</p>
            <p className="text-xs text-muted-foreground mt-2 italic">{t('terms.section_8a.last_updated')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">9. {t('terms_s9_title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-2 uppercase text-sm font-medium">{t('terms_s9_p1')}</p>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s9_p2')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">10. {t('terms_s10_title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-3 uppercase text-sm font-medium">{t('terms_s10_p1')}</p>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s10_p2')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">11. {t('terms_s11_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s11_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">12. {t('terms_s12_title')}</h2>
            <h3 className="font-semibold mb-2">12.1 {t('terms_s12_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s12_1_desc')}</p>
            <h3 className="font-semibold mb-2">12.2 {t('terms_s12_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s12_2_desc')}</p>
            <h3 className="font-semibold mb-2">12.3 {t('terms_s12_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms.section_12_3.survival_list')}</p>
            <h3 className="font-semibold mb-2">12.4 {t('terms_s12_4_title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s12_4_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">13. {t('terms_s13_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s13_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">14. {t('terms_s14_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s14_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">15. {t('terms_s15_title')}</h2>
            <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 mb-4">{t('terms_s15_warning')}</p>
            <h3 className="font-semibold mb-2">15.1 {t('terms_s15_1_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s15_1_desc')}</p>
            <h3 className="font-semibold mb-2">15.2 {t('terms_s15_2_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s15_2_desc')}</p>
            <h3 className="font-semibold mb-2">15.3 {t('terms_s15_3_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s15_3_us')}</p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm pl-4 border-l-2 border-muted">National Arbitration and Mediation (NAM) · 990 Stewart Avenue, 1st Floor, Garden City, NY 11530 · commercial@namadr.com · namadr.com</p>
            <p className="text-muted-foreground leading-relaxed mb-2">{t('terms_s15_3_intl')}</p>
            <p className="text-muted-foreground leading-relaxed mb-4 text-sm pl-4 border-l-2 border-muted">London Court of International Arbitration (LCIA) · 1 Paternoster Lane, London EC4M 7BQ · onlinefiling@lcia.org · lcia.org</p>
            <h3 className="font-semibold mb-2">15.4 {t('terms_s15_4_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s15_4_desc')}</p>
            <h3 className="font-semibold mb-2">15.5 {t('terms_s15_5_title')}</h3>
            <p className="text-muted-foreground leading-relaxed uppercase text-sm font-medium mb-4">{t('terms_s15_5_desc')}</p>
            <h3 className="font-semibold mb-2">15.6 {t('terms_s15_6_title')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{t('terms_s15_6_desc')}</p>
            <h3 className="font-semibold mb-2">15.7 {t('terms_s15_7_title')}</h3>
            <p className="text-muted-foreground leading-relaxed">{t('terms_s15_7_desc')}</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">16. {t('terms_s16_title')}</h2>
            <div className="space-y-4">
              <div><h3 className="font-semibold mb-1">16.1 {t('terms_s16_1_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_1_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.2 {t('terms_s16_2_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_2_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.3 {t('terms_s16_3_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_3_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.4 {t('terms_s16_4_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_4_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.5 {t('terms_s16_5_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_5_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.6 {t('terms_s16_6_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_6_desc')}</p></div>
              <div><h3 className="font-semibold mb-1">16.7 {t('terms_s16_7_title')}</h3><p className="text-muted-foreground leading-relaxed">{t('terms_s16_7_desc')}</p></div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-3">17. {t('terms_s17_title')}</h2>
            <div className="bg-muted rounded-xl p-5 text-muted-foreground text-sm space-y-1">
              <p className="font-semibold text-foreground">Temple East LLC</p>
              <p>Operating: {config.site_name}</p>
              <p>General Support: <a href="mailto:support@daterealgirls.com" className="text-primary underline underline-offset-4">support@daterealgirls.com</a></p>
              <p>Legal / Arbitration: <a href="mailto:legal@daterealgirls.com" className="text-primary underline underline-offset-4">legal@daterealgirls.com</a></p>
              <p>Website: <a href="https://www.daterealgirls.com" className="text-primary underline underline-offset-4">www.daterealgirls.com</a></p>
            </div>
            <p className="text-xs text-muted-foreground mt-6">© 2025 Temple East LLC. All Rights Reserved.</p>
          </section>

        </div>
      </div>
    </div>
  );
}