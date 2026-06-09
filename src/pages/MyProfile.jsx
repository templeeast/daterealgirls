import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Shield, Camera, Save, Trash2, Eye, EyeOff, AlertTriangle, XCircle, Smile, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, th, zhCN, de, vi as viLocale, pt } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import StripeIdentityCard from '@/components/profile/StripeIdentityCard';
import CountryCitySelector from '@/components/shared/CountryCitySelector';
import CodaPayButton from '@/components/subscription/CodaPayButton';
import AuthorizeNetButton from '@/components/subscription/AuthorizeNetButton';
import AuthorizeNetHostedButton from '@/components/subscription/AuthorizeNetHostedButton';
import FreeTrialButton from '@/components/subscription/FreeTrialButton';
import CancelSubscriptionDialog from '@/components/dialogs/CancelSubscriptionDialog';
import WhopButton from '@/components/subscription/WhopButton';

const INTERESTS = [
  { key: 'Travel', tKey: 'interest_travel' },
  { key: 'Music', tKey: 'interest_music' },
  { key: 'Movies', tKey: 'interest_movies' },
  { key: 'Cooking', tKey: 'interest_cooking' },
  { key: 'Fitness', tKey: 'interest_fitness' },
  { key: 'Reading', tKey: 'interest_reading' },
  { key: 'Art', tKey: 'interest_art' },
  { key: 'Photography', tKey: 'interest_photography' },
  { key: 'Gaming', tKey: 'interest_gaming' },
  { key: 'Hiking', tKey: 'interest_hiking' },
  { key: 'Dancing', tKey: 'interest_dancing' },
  { key: 'Sports', tKey: 'interest_sports' },
  { key: 'Yoga', tKey: 'interest_yoga' },
  { key: 'Beach', tKey: 'interest_beach' },
  { key: 'Food', tKey: 'interest_food' },
  { key: 'Nightlife', tKey: 'interest_nightlife' },
  { key: 'Animals', tKey: 'interest_animals' },
  { key: 'Fashion', tKey: 'interest_fashion' },
];

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, profile, isLoading, refetch } = useMyProfile();
  const { config } = useSiteConfig();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const subscriptionRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [form, setForm] = useState(null);
  const [winks, setWinks] = useState(null);

  useEffect(() => {
    if (!profile || !form) return;
    if (window.location.hash === '#subscription') {
      const raf = requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById('subscription');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [profile, form]);

  useEffect(() => {
    if (profile?.id && winks === null) {
      base44.entities.Wink.filter({ recipient_profile_id: profile.id }).then(setWinks);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/onboarding');
    }
    if (profile && !form) {
      setForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location_city: profile.location_city || '',
        location_country: profile.location_country || '',
        looking_for: profile.looking_for || '',
        interests: profile.interests || [],
        ...Object.fromEntries(
          Array.from({ length: 15 }, (_, i) => i + 1).flatMap(n => [
            [`photo_${n}`, profile[`photo_${n}`] || ''],
            [`photo_${n}_visible`, profile[`photo_${n}_visible`] !== false],
          ])
        ),
        instagram: profile.instagram || '',
        facebook: profile.facebook || '',
        tiktok: profile.tiktok || '',
      });
    }
  }, [profile, isLoading, form, navigate]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleInterest = (interest) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const dateFnsLocaleMap = { en: enUS, es, th, zh: zhCN, de, vi: viLocale, pt, tl: enUS, default: enUS };
  const dateFnsLocale = dateFnsLocaleMap[i18n.language] || enUS;

  const maxPhotos = config.max_photos || 3;
  const photoFields = Array.from({ length: maxPhotos }, (_, i) => `photo_${i + 1}`);

  // 15 stable refs — always created unconditionally regardless of maxPhotos
  const photoRefs = [
    useRef(), useRef(), useRef(), useRef(), useRef(),
    useRef(), useRef(), useRef(), useRef(), useRef(),
    useRef(), useRef(), useRef(), useRef(), useRef(),
  ];
  // Map field name -> ref (index-stable, covers all 15 slots)
  const getPhotoRef = (field) => {
    const n = parseInt(field.replace('photo_', ''), 10);
    return photoRefs[n - 1];
  };

  const handlePhotoUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField(field, file_url);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleIdFrontUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const isFirstUpload = !profile.id_document_url;
    const hasSelfie = !!profile.selfie_url;
    const updates = isFirstUpload
      ? { id_document_url: file_uri }
      : { id_document_url_2: file_uri, verification_status: 'unverified' };
    if (hasSelfie) updates.verification_status = isFirstUpload ? 'pending' : 'unverified';
    await base44.entities.MemberProfile.update(profile.id, updates);
    toast({ title: isFirstUpload ? 'Govt. ID front submitted!' : 'New Govt. ID front saved. Verification status reset.' });
    refetch();
  };

  const handleIdBackUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const isFirstUpload = !profile.id_document_back_url;
    const updates = isFirstUpload
      ? { id_document_back_url: file_uri }
      : { id_document_back_url_2: file_uri, verification_status: 'unverified' };
    await base44.entities.MemberProfile.update(profile.id, updates);
    toast({ title: isFirstUpload ? 'Govt. ID back submitted!' : 'New Govt. ID back saved. Verification status reset.' });
    refetch();
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const isFirstUpload = !profile.selfie_url;
    const updates = isFirstUpload
      ? { selfie_url: file_uri }
      : { selfie_url_2: file_uri, verification_status: 'unverified' };
    // If both docs now on file, set to pending
    const willHaveSelfie = true;
    const willHaveId = !!profile.id_document_url || !!profile.id_document_url_2;
    if (willHaveSelfie && willHaveId) updates.verification_status = isFirstUpload ? 'pending' : 'unverified';
    await base44.entities.MemberProfile.update(profile.id, updates);
    toast({ title: isFirstUpload ? 'Selfie uploaded! Upload your Govt. ID to complete verification.' : 'New selfie saved. Your verification status has been reset — please re-submit for review.' });
    refetch();
  };

  const handleCancelSubscription = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    setCancellingSubscription(true);
    try {
      if (config.payment_processor === 'whop') {
        const res = await base44.functions.invoke('whopCancelSubscription', {});
        if (res.data?.error) {
          toast({ title: res.data.error, variant: 'destructive' });
          return;
        }
      } else {
        const useSandbox = true;
        const res = await base44.functions.invoke('authorizeNetCancelSubscription', { useSandbox });
        if (res.data?.error) {
          toast({ title: res.data.error, variant: 'destructive' });
          return;
        }
      }
      toast({ title: 'Subscription cancelled. You keep access until the end of your billing period.' });
      setShowCancelDialog(false);
      refetch();
    } catch (err) {
      toast({ title: err?.response?.data?.error || 'Cancellation failed. Please contact support.', variant: 'destructive' });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.MemberProfile.update(profile.id, form);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast({ title: t('profile_updated') });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const verificationColors = {
    unverified: 'bg-muted text-muted-foreground',
    pending: 'bg-accent text-accent-foreground',
    verified: 'bg-primary/10 text-primary',
    rejected: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <CancelSubscriptionDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleConfirmCancel}
        loading={cancellingSubscription}
      />
      <h1 className="font-heading text-3xl font-bold mb-6">{t('my_profile_title')}</h1>

      {/* Incomplete profile banner */}
      {(!profile.profile_complete || !profile.selfie_url) && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <p className="font-semibold text-sm">{t('profile_incomplete_title')}</p>
            <p className="text-sm mt-0.5">{t('profile_incomplete_desc')}</p>
          </div>
        </div>
      )}

      {/* Verification Status */}
      {config.require_stripe_identity ? (
        <StripeIdentityCard
          profile={profile}
          publishableKey={config.stripe_identity_publishable_key}
          onRefetch={refetch}
        />
      ) : (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  {t('id_verification_title')}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.verification_status === 'unverified' && t('id_verification_unverified')}
                  {profile.verification_status === 'pending' && t('id_verification_pending')}
                  {profile.verification_status === 'verified' && t('id_verification_verified')}
                  {profile.verification_status === 'rejected' && t('id_verification_rejected')}
                </p>
              </div>
              <Badge className={verificationColors[profile.verification_status]}>
                {t(`verif_status_${profile.verification_status}`)}
              </Badge>
            </div>
            {true && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{t('id_docs_privacy_notice')}</span>
                </div>

                {/* Eligibility notice */}
                <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3 space-y-1">
                  <p className="font-semibold text-foreground" dangerouslySetInnerHTML={{ __html: t('verif_eligibility_both_required') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('verif_eligibility_no_id_needed') }} />
                  <p className="text-amber-700 font-medium">{t('verif_eligibility_reset_warning')}</p>
                </div>

                {/* Selfie upload */}
                <div className={`border-2 rounded-xl p-4 space-y-2 ${!profile.selfie_url ? 'border-primary/60 bg-accent/30' : 'border-border'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t('verif_selfie_title')}</p>
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">{t('verif_selfie_badge')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.selfie_url ? t('verif_selfie_on_file') : t('verif_selfie_no_file')}
                  </p>
                  <div className="flex items-center gap-3">
                    <label>
                      <Button variant={profile.selfie_url ? 'outline' : 'default'} size="sm" className="gap-2" asChild>
                        <span>
                          <Camera className="w-4 h-4" />
                          {profile.selfie_url ? t('verif_selfie_reupload_btn') : t('verif_selfie_upload_btn')}
                        </span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
                    </label>
                    {profile.selfie_url_2 && (
                      <span className="text-xs text-amber-600 font-medium">{t('verif_selfie_updated_tag')}</span>
                    )}
                  </div>
                </div>

                {/* Govt ID — Front */}
                <div className={`border-2 rounded-xl p-4 space-y-2 ${!profile.id_document_url ? 'border-amber-300 bg-amber-50' : 'border-border'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t('govt_id_front_title')}</p>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{t('optional_badge')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.id_document_url ? t('govt_id_front_on_file') : t('govt_id_front_no_file')}
                  </p>
                  <div className="flex items-center gap-3">
                    <label>
                      <Button variant={profile.id_document_url ? 'outline' : 'secondary'} size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          {profile.id_document_url ? t('govt_id_front_reupload_btn') : t('govt_id_front_upload_btn')}
                        </span>
                      </Button>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdFrontUpload} />
                    </label>
                    {profile.id_document_url_2 && (
                      <span className="text-xs text-amber-600 font-medium">{t('verif_id_updated_tag')}</span>
                    )}
                  </div>
                </div>

                {/* Govt ID — Back */}
                <div className={`border-2 rounded-xl p-4 space-y-2 ${!profile.id_document_back_url ? 'border-amber-300/60 bg-amber-50/50' : 'border-border'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t('govt_id_back_title')}</p>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{t('optional_badge')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {profile.id_document_back_url ? t('govt_id_back_on_file') : t('govt_id_back_no_file')}
                  </p>
                  <div className="flex items-center gap-3">
                    <label>
                      <Button variant={profile.id_document_back_url ? 'outline' : 'secondary'} size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" />
                          {profile.id_document_back_url ? t('govt_id_back_reupload_btn') : t('govt_id_back_upload_btn')}
                        </span>
                      </Button>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdBackUpload} />
                    </label>
                    {profile.id_document_back_url_2 && (
                      <span className="text-xs text-amber-600 font-medium">{t('verif_id_updated_tag')}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Info (for men) */}
      {profile.gender === 'male' && (
        <Card ref={subscriptionRef} id="subscription" className={`mb-6 scroll-mt-20 ${profile.subscription_status !== 'active' ? 'border-2 border-primary/30' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold mb-1">{t('subscription_title')}</h3>
                {profile.subscription_status === 'active' ? (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {profile.subscription_end_date
                        ? t('subscription_active_renews', { date: profile.subscription_end_date })
                        : t('subscription_active')}
                    </p>

                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('subscription_free_desc')}</p>
                )}
              </div>
              <Badge
                className={profile.subscription_status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
              >
                {profile.subscription_status === 'active' ? t('subscription_premium_badge') : t('subscription_free_badge')}
              </Badge>
            </div>
            {/* Active subscription actions */}
            {profile.subscription_status === 'active' && (
            <div className="mt-4 pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              {t('subscription_managed_notice')}
            </p>
            <div className="flex flex-col gap-2">
              {config.payment_processor === 'whop' && (
                <a href="https://whop.com/@me/settings/memberships/" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {t('manage_subscription_btn')}
                  </Button>
                </a>
              )}
              {(config.payment_processor === 'whop' || profile.paymentnerds_subscription_id) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
                  onClick={handleCancelSubscription}
                  disabled={cancellingSubscription}
                >
                  <XCircle className="w-4 h-4" />
                  {cancellingSubscription ? t('cancelling') : t('cancel_subscription_btn')}
                </Button>
              )}
            </div>
            </div>
            )}

            {profile.subscription_status !== 'active' && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-accent/50 rounded-xl text-sm text-foreground">
                  <strong className="text-primary">{t('subscription_upgrade_cta')}</strong>{' '}
                  {t('subscription_upgrade_desc', { price: config.subscription_price || 9.99 })}
                </div>

                {/* Paid option — only show the configured payment processor */}
                <div className="space-y-2">
                  {true && (
                    <p className="text-sm font-medium">{t('subscribe_to_premium')}</p>
                  )}

                  {config.payment_processor === 'whop' ? (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium">{t('subscribe_via_whop')}</p>
                      <WhopButton
                        planId={config.whop_men_plan_id}
                        prefillEmail={user?.email}
                        returnUrl={`${window.location.origin}/my-profile`}
                        devMode={config.dev_mode}
                      />
                    </div>
                  ) : config.payment_processor === 'codapay' ? (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium">{t('pay_via_local')}</p>
                      <CodaPayButton
                        price={config.subscription_price || 4.99}
                        onSuccess={refetch}
                      />
                    </div>
                  ) : config.payment_processor === 'segpay' ? (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium">{t('pay_via_segpay')}</p>
                      <p className="text-xs text-muted-foreground">{t('segpay_coming_soon')}</p>
                    </div>
                  ) : (
                    <div className="border rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium">{t('pay_by_card')}</p>
                      {config.authorizenet_use_hosted_page ? (
                        <AuthorizeNetHostedButton
                          price={config.subscription_price || 4.99}
                          onSuccess={refetch}
                        />
                      ) : (
                        <AuthorizeNetButton
                          price={config.subscription_price || 4.99}
                          onSuccess={refetch}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Winks Received */}
      {winks && winks.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">😉</span>
                <div>
                  <p className="font-semibold text-lg">{t('winks_received_title', { count: winks.length })}</p>
                  <p className="text-sm text-muted-foreground">{t('winks_received_desc')}</p>
                </div>
              </div>
              <button onClick={() => navigate('/winks')} className="text-sm text-primary hover:underline shrink-0">{t('view_all')}</button>
            </div>
            <div className="flex flex-wrap gap-3">
              {winks.map(wink => (
                <a
                  key={wink.id}
                  href={`/browse`}
                  onClick={e => { e.preventDefault(); navigate(`/profile/${wink.sender_id}`); }}
                  className="flex items-center gap-2 bg-muted hover:bg-accent rounded-full pl-1 pr-3 py-1 transition-colors cursor-pointer"
                >
                  {wink.sender_photo ? (
                    <img src={wink.sender_photo} className="w-8 h-8 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">😉</div>
                  )}
                  <span className="text-sm font-medium">{wink.sender_name || t('someone')}</span>
                  {wink.created_date && (
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(wink.created_date), { addSuffix: true, locale: dateFnsLocale })}</span>
                  )}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" /> {t('photos_title')}
          </CardTitle>
          <CardDescription>{t('photos_upload_desc', { n: config.max_photos || 3 })}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {photoFields.map((field, i) => {
              const visibleKey = `${field}_visible`;
              const isVisible = form[visibleKey] !== false;

              return (
                <div key={field} className="flex flex-col gap-1">
                  <div
                    className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative cursor-pointer ${form[field] ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'} ${!isVisible && form[field] ? 'opacity-50' : ''}`}
                    onClick={() => getPhotoRef(field).current?.click()}
                  >
                    {form[field] ? (
                      <img src={form[field]} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">{t('photo_label', { n: i + 1 })}</span>
                      </div>
                    )}
                  </div>
                  <input ref={getPhotoRef(field)} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, field)} />

                  {form[field] && (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => updateField(visibleKey, !isVisible)}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-1 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                        title={isVisible ? t('photo_hidden') : t('photo_visible')}
                      >
                        {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                        <span className="text-muted-foreground">{isVisible ? t('photo_visible') : t('photo_hidden')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { updateField(field, ''); updateField(visibleKey, true); }}
                        className="flex items-center justify-center p-1 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                        title={t('photo_delete')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">{t('profile_info_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('display_name_label')}</Label>
            <Input value={form.display_name} onChange={e => updateField('display_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('bio_label')} <span className="text-muted-foreground text-xs">({form.bio.length}/{config.bio_max_length || 500})</span></Label>
            <Textarea
              value={form.bio}
              onChange={e => updateField('bio', e.target.value.slice(0, config.bio_max_length || 500))}
              className="h-32"
              placeholder={t('bio_placeholder')}
            />
          </div>
          <CountryCitySelector
            country={form.location_country}
            city={form.location_city}
            onCountryChange={v => updateField('location_country', v)}
            onCityChange={v => updateField('location_city', v)}
          />
          <div className="space-y-2">
            <Label>{t('looking_for_label')}</Label>
            <Select value={form.looking_for} onValueChange={v => updateField('looking_for', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="relationship">{t('browse_relationship')}</SelectItem>
                <SelectItem value="friendship">{t('browse_friendship')}</SelectItem>
                <SelectItem value="casual">{t('browse_casual')}</SelectItem>
                <SelectItem value="marriage">{t('browse_marriage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('interests_label')}</Label>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(({ key, tKey }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleInterest(key)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    form.interests.includes(key)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {t(tKey)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">{t('social_media_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('instagram_label')}</Label>
            <Input placeholder={t('username_placeholder')} value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('facebook_label')}</Label>
            <Input placeholder={t('facebook_placeholder')} value={form.facebook} onChange={e => updateField('facebook', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('tiktok_label')}</Label>
            <Input placeholder={t('username_placeholder')} value={form.tiktok} onChange={e => updateField('tiktok', e.target.value)} />
          </div>
        </CardContent>
      </Card>


      {/* Save */}
      <Button className="w-full gap-2 rounded-full" size="lg" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? t('saving') : t('save_profile')}
      </Button>
    </div>
  );
}