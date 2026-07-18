import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Dynamically builds and renders the complete list of token costs
 * available to the currently logged-in user, based on their gender
 * and the site configuration flags.
 */
export default function TokenCostsList({ profile, config }) {
  const { t } = useTranslation();
  const isMale = profile?.gender === 'male';

  const rows = [];

  // 1. Browse free profiles — always available
  rows.push({
    label: t('token_cost_browse_free', { n: config?.tokens_free_browse_limit ?? 25 }),
    cost: t('free'),
    isFree: true,
  });

  // 2. Browse all profiles (1 week)
  const browseEnabled = isMale
    ? config?.tokens_browse_men_enabled !== false
    : config?.tokens_browse_women_enabled !== false;
  if (browseEnabled) {
    const cost = isMale ? (config?.tokens_browse_cost_men ?? 100) : (config?.tokens_browse_cost_women ?? 0);
    rows.push({
      label: t('token_cost_browse_all'),
      cost: cost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: cost })} (1 ${t('token_cost_week')})`,
      isFree: cost === 0,
    });
  }

  // 3. Send a message — verification required
  const msgEnabled = isMale
    ? config?.tokens_msg_men_enabled !== false
    : config?.tokens_msg_women_enabled !== false;
  if (msgEnabled) {
    const cost = isMale ? (config?.tokens_msg_cost_men ?? 2) : (config?.tokens_msg_cost_women ?? 0);
    rows.push({
      label: t('token_cost_send_message'),
      cost: cost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: cost })} (${t('token_cost_per_message')})`,
      isFree: cost === 0,
      verificationRequired: true,
    });
  }

  // 4. Send a wink
  const winkEnabled = isMale
    ? config?.tokens_wink_men_enabled !== false
    : config?.tokens_wink_women_enabled !== false;
  if (winkEnabled) {
    const cost = isMale ? (config?.tokens_wink_cost_men ?? 5) : (config?.tokens_wink_cost_women ?? 0);
    rows.push({
      label: t('token_cost_send_wink'),
      cost: cost === 0 ? t('free') : t('token_cost_n_tokens', { n: cost }),
      isFree: cost === 0,
      verificationRequired: true,
    });
  }

  // 5. Send a photo in message — gender-specific cost
  {
    const photoCost = isMale ? (config?.tokens_msg_photo_cost ?? 5) : (config?.tokens_msg_photo_cost_women ?? 0);
    rows.push({
      label: t('token_cost_send_photo'),
      cost: photoCost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: photoCost })} (${t('token_cost_per_photo')})`,
      isFree: photoCost === 0,
    });
  }

  // 6. Send a video in message — shown when enabled for the user's gender
  if (isMale ? config?.videos_chat_men_enabled : config?.videos_chat_women_enabled) {
    const cost = isMale ? (config?.tokens_msg_video_cost_men ?? 10) : (config?.tokens_msg_video_cost_women ?? 10);
    rows.push({
      label: t('token_cost_send_video'),
      cost: cost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: cost })} (${t('token_cost_per_video')})`,
      isFree: cost === 0,
    });
  }

  // 7. Embed payment link in chat — verification required, conditional on gender enable
  const stripeEnabled = isMale ? config?.stripe_payment_link_enabled_men : config?.stripe_payment_link_enabled_women;
  if (stripeEnabled) {
    const cost = config?.stripe_link_message_credit_cost ?? 5;
    rows.push({
      label: t('token.action.embed_payment_link'),
      cost: t('token_cost_n_tokens', { n: cost }),
      isFree: false,
      verificationRequired: true,
    });
  }

  // 8. View private photos — verification required, gender-specific cost
  {
    const privatePhotoCost = isMale ? (config?.tokens_private_photo_cost ?? 5) : (config?.tokens_private_photo_cost_women ?? 0);
    rows.push({
      label: t('token_cost_view_private_photos'),
      cost: privatePhotoCost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: privatePhotoCost })} (${t('token_cost_per_photo')})`,
      isFree: privatePhotoCost === 0,
      verificationRequired: true,
    });
  }

  // 9. View private videos — always shown, gender-specific cost
  {
    const cost = isMale ? (config?.tokens_private_video_cost ?? 25) : (config?.tokens_private_video_cost_women ?? 0);
    rows.push({
      label: t('token_cost_view_private_video'),
      cost: cost === 0 ? t('free') : `${t('token_cost_n_tokens', { n: cost })} (${t('token_cost_per_video')})`,
      isFree: cost === 0,
      verificationRequired: true,
    });
  }

  // 10. ID Verification
  const verifyEnabled = isMale
    ? config?.tokens_verify_men_enabled !== false
    : config?.tokens_verify_women_enabled !== false;
  if (verifyEnabled) {
    const cost = isMale ? (config?.tokens_verify_cost_men ?? 300) : (config?.tokens_verify_cost_women ?? 300);
    rows.push({
      label: t('token_cost_id_verification'),
      cost: t('token_cost_n_tokens', { n: cost }),
      isFree: false,
    });
  }

  // 11. Remove ads
  if (config?.ad_free_enabled !== false) {
    const cost = config?.ad_free_token_cost ?? 200;
    const days = config?.ad_free_duration_days ?? 7;
    rows.push({
      label: `${t('token_cost_remove_ads')} (${days} ${t('ad_free_days')})`,
      cost: t('token_cost_n_tokens', { n: cost }),
      isFree: false,
    });
  }

  // 12. Toggle profile privacy
  {
    const cost = config?.tokens_profile_privacy_toggle_cost ?? 100;
    rows.push({
      label: t('token_cost_profile_privacy_toggle'),
      cost: t('token_cost_n_tokens', { n: cost }),
      isFree: false,
    });
  }

  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <h4 className="text-sm font-semibold mb-3">{t('token_cost_costs_title')}</h4>
      <div className="space-y-2 text-sm">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-start justify-between gap-4">
            <span>
              {row.label}
              {row.verificationRequired && (
                <span className="text-amber-600 font-medium">*</span>
              )}
            </span>
            <span className={`text-right whitespace-nowrap shrink-0 ${row.isFree ? 'text-green-600 font-medium' : ''}`}>{row.cost}</span>
          </div>
        ))}
      </div>
      {rows.some(r => r.verificationRequired) && (
        <p className="mt-2 text-xs text-amber-600">{t('token_cost_verification_footnote')}</p>
      )}
    </div>
  );
}