import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function TokenGuide() {
  const { config } = useSiteConfig();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-6 w-auto" />
            ) : (
              <Heart className="w-5 h-5 text-primary fill-primary" />
            )}
            <span className="font-heading font-semibold">{config.site_name}</span>
          </Link>
          <LanguageSelector />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Link>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{t('token_table_title')}</h1>
        <p className="text-muted-foreground text-sm mb-8">{t('token_table_footer')}</p>

        {/* Cost Breakdown Table */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b">
                  <th className="text-left px-6 py-3 font-normal text-muted-foreground">{t('token_table_action')}</th>
                  <th className="text-center px-6 py-3 font-normal text-muted-foreground">{t('browse_men')}</th>
                  <th className="text-center px-6 py-3 font-normal text-muted-foreground">{t('browse_women')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">{t('token_cost_browse_free', { n: config.tokens_free_browse_limit ?? 25 })}</td>
                  <td className="text-center px-6 py-4 text-green-600 font-semibold">{t('free')}</td>
                  <td className="text-center px-6 py-4 text-green-600 font-semibold">{t('free')}</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">{t('token_cost_browse_all')}</td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_browse_cost_men ?? 100 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_browse_pass')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_browse_cost_women ?? 0 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_browse_unlimited')}</div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">
                    {t('token_cost_send_message')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_msg_cost_men ?? 2 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_message')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_msg_cost_women ?? 0 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_message')}</div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">{t('token_cost_send_wink')}</td>
                  <td className="text-center px-6 py-4">
                    {config.tokens_wink_men_enabled !== false ? (
                      <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_wink_cost_men ?? 5 })}</div>
                    ) : (
                      <span className="text-green-600 font-semibold">{t('free')}</span>
                    )}
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_wink')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    {config.tokens_wink_women_enabled ? (
                      <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_wink_cost_women ?? 0 })}</div>
                    ) : (
                      <span className="text-green-600 font-semibold">{t('free')}</span>
                    )}
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_wink')}</div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">{t('token_cost_send_photo')}</td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_msg_photo_cost ?? 5 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_photo')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: 0 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_photo')}</div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">
                    {t('token_cost_send_video')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    {config.videos_chat_men_enabled ? (
                      <>
                        <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_msg_video_cost_men ?? 10 })}</div>
                        <div className="text-xs text-muted-foreground">{t('token_cost_per_video')}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="text-center px-6 py-4">
                    {config.videos_chat_women_enabled ? (
                      <>
                        <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_msg_video_cost_women ?? 0 })}</div>
                        <div className="text-xs text-muted-foreground">{t('token_cost_per_video')}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
                {(config.stripe_payment_link_enabled_men || config.stripe_payment_link_enabled_women) && (
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">
                    {t('token.action.embed_payment_link')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    {config.stripe_payment_link_enabled_men ? (
                      <>
                        <div className="font-semibold">{t('token_cost_n_tokens', { n: config.stripe_link_message_credit_cost ?? 5 })}</div>
                        <div className="text-xs text-muted-foreground">{t('token.action.embed_payment_link.sublabel')}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground" aria-label={t('token.embed_payment_link.not_available')}>—</span>
                    )}
                  </td>
                  <td className="text-center px-6 py-4">
                    {config.stripe_payment_link_enabled_women ? (
                      <>
                        <div className="font-semibold">{t('token_cost_n_tokens', { n: config.stripe_link_message_credit_cost ?? 5 })}</div>
                        <div className="text-xs text-muted-foreground">{t('token.action.embed_payment_link.sublabel')}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground" aria-label={t('token.embed_payment_link.not_available')}>—</span>
                    )}
                  </td>
                </tr>
                )}
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">
                    {t('token_cost_view_private_photos')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: 5 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_photo')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold text-green-600">{t('free')}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_photo')}</div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4 font-medium">
                    {t('token_cost_view_private_video')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_private_video_cost ?? 10 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_video')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold text-green-600">{t('free')}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_per_video')}</div>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">{t('id_verification')}</td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_verify_cost_men ?? 300 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_one_time')}</div>
                  </td>
                  <td className="text-center px-6 py-4">
                    <div className="font-semibold">{t('token_cost_n_tokens', { n: config.tokens_verify_cost_women ?? 300 })}</div>
                    <div className="text-xs text-muted-foreground">{t('token_cost_one_time')}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t">
            <p className="text-xs text-muted-foreground">{t('token_table_footer')}</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="outline" className="rounded-full">{t('back')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}