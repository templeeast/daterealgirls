import React, { useState, useEffect } from 'react';
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
import { Upload, Shield, Camera, Save, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useTranslation } from 'react-i18next';
import StripeIdentityCard from '@/components/profile/StripeIdentityCard';
import CodaPayButton from '@/components/subscription/CodaPayButton';
import AuthorizeNetButton from '@/components/subscription/AuthorizeNetButton';
import FreeTrialButton from '@/components/subscription/FreeTrialButton';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Cooking', 'Fitness', 'Reading',
  'Art', 'Photography', 'Gaming', 'Hiking', 'Dancing', 'Sports',
  'Yoga', 'Beach', 'Food', 'Nightlife', 'Animals', 'Fashion'
];

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, profile, isLoading, refetch } = useMyProfile();
  const { config } = useSiteConfig();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

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
        photo_1: profile.photo_1 || '',
        photo_2: profile.photo_2 || '',
        photo_3: profile.photo_3 || '',
        photo_1_visible: profile.photo_1_visible !== false,
        photo_2_visible: profile.photo_2_visible !== false,
        photo_3_visible: profile.photo_3_visible !== false,
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

  const handlePhotoUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField(field, file_url);
  };

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    await base44.entities.MemberProfile.update(profile.id, {
      id_document_url: file_uri,
      verification_status: 'pending',
    });
    toast({ title: t('id_submitted') });
    refetch();
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    await base44.entities.MemberProfile.update(profile.id, {
      selfie_url: file_uri,
    });
    toast({ title: 'Verification selfie uploaded successfully.' });
    refetch();
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.MemberProfile.update(profile.id, form);
    queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    toast({ title: t('profile_updated') });
    setSaving(false);
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
                {profile.verification_status}
              </Badge>
            </div>
            {(profile.verification_status === 'unverified' || profile.verification_status === 'rejected') && (
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                  <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{t('id_docs_privacy_notice')}</span>
                </div>

                {/* Selfie upload — MANDATORY */}
                <div className={`border-2 rounded-xl p-4 space-y-2 ${!profile.selfie_url ? 'border-primary/60 bg-accent/30' : 'border-border'}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t('selfie_step_title')}</p>
                    <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">{t('required_badge')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('selfie_step_desc') }} />
                  <div className="flex items-center gap-3">
                    {profile.selfie_url && (
                      <span className="text-xs text-primary font-medium">{t('selfie_on_file')}</span>
                    )}
                    <label>
                      <Button variant={profile.selfie_url ? 'outline' : 'default'} size="sm" className="gap-2" asChild>
                        <span>
                          <Camera className="w-4 h-4" />
                          {profile.selfie_url ? t('replace_selfie') : t('upload_selfie')}
                        </span>
                      </Button>
                      <input type="file" accept="image/*" className="hidden" onChange={handleSelfieUpload} />
                    </label>
                  </div>
                </div>

                {/* Govt ID upload — OPTIONAL but needed for verified badge */}
                <div className="border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{t('govtid_step_title')}</p>
                    <Badge variant="outline" className="text-xs px-2 py-0.5">{t('optional_badge')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('govtid_step_desc') }} />
                  <div className="flex items-center gap-3">
                    {profile.id_document_url && (
                      <span className="text-xs text-primary font-medium">✓ ID on file</span>
                    )}
                    <label>
                      <Button variant="outline" size="sm" className="gap-2" asChild>
                        <span>
                          <Upload className="w-4 h-4" /> {t('upload_govt_id')}
                        </span>
                      </Button>
                      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Info (for men) */}
      {profile.gender === 'male' && (
        <Card className={`mb-6 ${profile.subscription_status !== 'active' ? 'border-2 border-primary/30' : ''}`}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold mb-1">{t('subscription_title')}</h3>
                {profile.subscription_status === 'active' ? (
                  <p className="text-sm text-muted-foreground">
                    {profile.subscription_end_date ? t('subscription_active_renews', { date: profile.subscription_end_date }) : t('subscription_active')}
                  </p>
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
            {profile.subscription_status !== 'active' && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-accent/50 rounded-xl text-sm text-foreground">
                  <strong className="text-primary">{t('subscription_upgrade_cta')}</strong>{' '}
                  Unlock unlimited browsing, messaging, and more for just ${config.subscription_price || 9.99}/month.
                </div>
                <FreeTrialButton profile={profile} onSuccess={refetch} />
                {!profile.free_trial_claimed && (
                  <p className="text-xs text-center text-muted-foreground">— or skip the trial and subscribe now —</p>
                )}
                {/* Authorize.net (card payment) */}
                <div className="border rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium">Pay by Credit / Debit Card</p>
                  <AuthorizeNetButton
                    price={config.subscription_price || 9.99}
                    onSuccess={refetch}
                  />
                </div>
                {/* CodaPay (Southeast Asia & other regions) */}
                <div className="border rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium">Pay via CodaPay (Asia / Local Methods)</p>
                  <CodaPayButton
                    price={config.subscription_price || 9.99}
                    onSuccess={refetch}
                  />
                </div>
              </div>
            )}
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
            {['photo_1', 'photo_2', 'photo_3'].map((field, i) => {
              const visibleKey = `${field}_visible`;
              const isVisible = form[visibleKey] !== false;

              return (
                <div key={field} className="flex flex-col gap-1">
                  <label className="cursor-pointer">
                    <div className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors relative ${form[field] ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'} ${!isVisible && form[field] ? 'opacity-50' : ''}`}>
                      {form[field] ? (
                        <img src={form[field]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="text-center p-2">
                          <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">{t('photo_label', { n: i + 1 })}</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, field)} />
                  </label>

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('city_label')}</Label>
              <Input value={form.location_city} onChange={e => updateField('location_city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('country_label')}</Label>
              <Input value={form.location_country} onChange={e => updateField('location_country', e.target.value)} />
            </div>
          </div>
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
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    form.interests.includes(interest)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {interest}
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