import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Upload, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useSiteConfig from '@/hooks/useSiteConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import CountryCitySelector from '@/components/shared/CountryCitySelector';
import StripeIdentityStep from '@/components/onboarding/StripeIdentityStep';
import DiditVerificationStep from '@/components/onboarding/DiditVerificationStep';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Cooking', 'Fitness', 'Reading',
  'Art', 'Photography', 'Gaming', 'Hiking', 'Dancing', 'Sports',
  'Yoga', 'Beach', 'Food', 'Nightlife', 'Animals', 'Fashion'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // If user already has a profile, redirect them away from onboarding
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (me) {
          const profiles = await base44.entities.MemberProfile.filter({ user_id: me.id });
          if (profiles?.length > 0) {
            navigate('/browse', { replace: true });
            return;
          }
        }
      } catch {
        // not authenticated, let onboarding render normally
      }
      setCheckingProfile(false);
    })();
  }, [navigate]);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    gender: '',
    date_of_birth: '',
    location_city: '',
    location_country: '',
    bio: '',
    looking_for: '',
    interests: [],
    photo_1: '',
    photo_2: '',
    photo_3: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

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

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      try {
        const res = await base44.functions.invoke('uploadToCloudinary', {
          file: base64,
          filename: file.name,
        });
        if (res.data?.url) {
          updateField(field, res.data.url);
        }
      } catch {
        // silently fail — user can retry
      }
    };
    reader.readAsDataURL(file);
  };

  const calculateAge = (dob) => {
    // Parse date parts directly to avoid UTC-vs-local timezone issues
    const [year, month, day] = dob.split('-').map(Number);
    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && today.getDate() < day)) age--;
    return age;
  };

  const handleSubmit = async () => {
    const age = calculateAge(form.date_of_birth);
    if (age < 18) {
      toast({ title: t('age_error'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    const me = await base44.auth.me();
    const newProfile = await base44.entities.MemberProfile.create({
      ...form,
      user_id: me.id,
      age,
      verification_status: 'unverified',
      is_active: true,
      is_suspended: false,
      profile_complete: true,
      tokens: config.welcome_tokens ?? 5000,
    });

    // Award GODATE26 welcome bonus (non-blocking)
    try {
      await base44.functions.invoke('awardGodate26Promo', { memberId: newProfile.id });
      toast({ title: '🎉 Welcome! Your GODATE26 bonus of 1,000 tokens has been added to your account.' });
    } catch (e) {
      console.warn('GODATE26 award failed:', e.message);
      toast({ title: t('profile_created', { siteName: config.site_name }) });
    }

    navigate('/browse');
  };

  const requireStripeIdentity = config.require_stripe_identity === true;

  const ageIfDobEntered = form.date_of_birth ? calculateAge(form.date_of_birth) : null;
  const isUnderAge = ageIfDobEntered !== null && ageIfDobEntered < 18;

  const steps = [
    // Step 0: Basic Info
    <div key="basic" className="space-y-4">
      <div className="space-y-2">
        <Label>{t('display_name_label')}</Label>
        <Input placeholder={t('display_name_placeholder')} value={form.display_name} onChange={e => updateField('display_name', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t('gender_label')}</Label>
        <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
          <SelectTrigger><SelectValue placeholder={t('select_gender')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="female">{t('gender_woman')}</SelectItem>
            <SelectItem value="male">{t('gender_man')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('dob_label')}</Label>
        <Input type="date" value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
        {isUnderAge ? (
          <p className="text-xs text-destructive font-medium">You must be at least 18 years old to join.</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t('dob_notice')}</p>
        )}
      </div>
      <CountryCitySelector
        country={form.location_country}
        city={form.location_city}
        onCountryChange={v => updateField('location_country', v)}
        onCityChange={v => updateField('location_city', v)}
      />
    </div>,

    // Step 1: About You
    <div key="about" className="space-y-4">
      <div className="space-y-2">
        <Label>{t('bio_label')} <span className="text-muted-foreground">({form.bio.length}/{config.bio_max_length || 500})</span></Label>
        <Textarea
          placeholder={t('bio_placeholder')}
          value={form.bio}
          onChange={e => updateField('bio', e.target.value.slice(0, config.bio_max_length || 500))}
          className="h-32"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('looking_for_label')}</Label>
        <Select value={form.looking_for} onValueChange={v => updateField('looking_for', v)}>
          <SelectTrigger><SelectValue placeholder={t('bio_looking_placeholder')} /></SelectTrigger>
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
    </div>,

    // Step 2: Identity Verification
    ...(requireStripeIdentity ? [
      <StripeIdentityStep
        key="identity"
        publishableKey={config.stripe_identity_publishable_key}
        onVerified={() => { setIdentityVerified(true); setStep(s => s + 1); }}
        onSkip={() => setStep(s => s + 1)}
      />
    ] : [
      <DiditVerificationStep key="verify" />,
    ]),

    // Step 3: Photos & Social
    <div key="photos" className="space-y-6">
      <div className="space-y-2">
        <Label>{t('photos_label', { n: config.max_photos || 3 })}</Label>
        <div className="grid grid-cols-3 gap-4">
          {['photo_1', 'photo_2', 'photo_3'].map((field, i) => (
            <label key={field} className="cursor-pointer">
              <div className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${form[field] ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'}`}>
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
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Label>{t('social_optional')}</Label>
        <Input placeholder={t('instagram_placeholder')} value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
        <Input placeholder={t('facebook_profile_placeholder')} value={form.facebook} onChange={e => updateField('facebook', e.target.value)} />
        <Input placeholder={t('tiktok_placeholder')} value={form.tiktok} onChange={e => updateField('tiktok', e.target.value)} />
      </div>
    </div>,
  ];

  const stepTitles = [
    t('step_basic'),
    t('step_about'),
    t('step_identity'),
    t('step_photos'),
  ];
  const verifyStepIndex = 2;
  const canProceed = step === 0
    ? form.display_name && form.gender && form.date_of_birth && !isUnderAge
    : true;

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Heart className="w-8 h-8 text-primary fill-primary mx-auto mb-2" />
          <CardTitle className="font-heading text-2xl">{t('onboarding_title')}</CardTitle>
          <CardDescription>{t('onboarding_step', { current: step + 1, total: steps.length, title: stepTitles[step] })}</CardDescription>
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {steps[step]}
            </motion.div>
          </AnimatePresence>
          {!(requireStripeIdentity && step === 2) && (
            <div className="flex justify-between mt-8">
              <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('back_btn')}
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
                  {t('next_btn')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving || !canProceed}>
                  {saving ? t('creating') : t('complete_profile_btn')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}