import React, { useState } from 'react';
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
import { addMonths, format } from 'date-fns';
import StripeIdentityStep from '@/components/onboarding/StripeIdentityStep';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Cooking', 'Fitness', 'Reading',
  'Art', 'Photography', 'Gaming', 'Hiking', 'Dancing', 'Sports',
  'Yoga', 'Beach', 'Food', 'Nightlife', 'Animals', 'Fashion'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { config } = useSiteConfig();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField(field, file_url);
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleSubmit = async () => {
    const age = calculateAge(form.date_of_birth);
    if (age < 18) {
      toast({ title: 'You must be 18 or older to join', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const me = await base44.auth.me();
    const now = new Date();
    const trialEnd = addMonths(now, config.trial_duration_months || 3);

    await base44.entities.MemberProfile.create({
      ...form,
      user_id: me.id,
      age,
      verification_status: identityVerified ? 'pending' : 'unverified',
      is_active: true,
      is_suspended: false,
      profile_complete: true,
      subscription_status: form.gender === 'female' ? 'free' : 'trial',
      trial_start_date: form.gender === 'male' ? format(now, 'yyyy-MM-dd') : undefined,
      trial_end_date: form.gender === 'male' ? format(trialEnd, 'yyyy-MM-dd') : undefined,
    });

    toast({ title: 'Profile created! Welcome to ' + config.site_name });
    navigate('/browse');
  };

  const requireStripeIdentity = config.require_stripe_identity === true;

  const steps = [
    // Step 0: Basic Info
    <div key="basic" className="space-y-4">
      <div className="space-y-2">
        <Label>Display Name</Label>
        <Input placeholder="How should others see you?" value={form.display_name} onChange={e => updateField('display_name', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={form.gender} onValueChange={v => updateField('gender', v)}>
          <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="female">Woman</SelectItem>
            <SelectItem value="male">Man</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <Input type="date" value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} />
        <p className="text-xs text-muted-foreground">You must be 18+ to join</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>City</Label>
          <Input placeholder="Your city" value={form.location_city} onChange={e => updateField('location_city', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input placeholder="Your country" value={form.location_country} onChange={e => updateField('location_country', e.target.value)} />
        </div>
      </div>
    </div>,

    // Step 1: About You
    <div key="about" className="space-y-4">
      <div className="space-y-2">
        <Label>Bio <span className="text-muted-foreground">({form.bio.length}/{config.bio_max_length || 500})</span></Label>
        <Textarea
          placeholder="Tell people about yourself..."
          value={form.bio}
          onChange={e => updateField('bio', e.target.value.slice(0, config.bio_max_length || 500))}
          className="h-32"
        />
      </div>
      <div className="space-y-2">
        <Label>Looking For</Label>
        <Select value={form.looking_for} onValueChange={v => updateField('looking_for', v)}>
          <SelectTrigger><SelectValue placeholder="What are you looking for?" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relationship">Relationship</SelectItem>
            <SelectItem value="friendship">Friendship</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="marriage">Marriage</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Interests</Label>
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

    // Step 2: Identity Verification (conditional)
    ...(requireStripeIdentity ? [
      <StripeIdentityStep
        key="identity"
        publishableKey={config.stripe_identity_publishable_key}
        onVerified={() => { setIdentityVerified(true); setStep(s => s + 1); }}
        onSkip={() => setStep(s => s + 1)}
      />
    ] : []),

    // Step 3: Photos & Social
    <div key="photos" className="space-y-6">
      <div className="space-y-2">
        <Label>Photos (up to {config.max_photos || 3})</Label>
        <div className="grid grid-cols-3 gap-4">
          {['photo_1', 'photo_2', 'photo_3'].map((field, i) => (
            <label key={field} className="cursor-pointer">
              <div className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${form[field] ? 'border-primary' : 'border-muted-foreground/30 hover:border-primary/50'}`}>
                {form[field] ? (
                  <img src={form[field]} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="text-center p-2">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Photo {i + 1}</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(e, field)} />
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Label>Social Media (optional)</Label>
        <Input placeholder="Instagram username" value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
        <Input placeholder="Facebook profile link" value={form.facebook} onChange={e => updateField('facebook', e.target.value)} />
        <Input placeholder="TikTok username" value={form.tiktok} onChange={e => updateField('tiktok', e.target.value)} />
      </div>
    </div>,
  ];

  const stepTitles = [
    'Basic Information',
    'About You',
    ...(requireStripeIdentity ? ['Identity Verification'] : []),
    'Photos & Social',
  ];
  const canProceed = step === 0 ? form.display_name && form.gender && form.date_of_birth : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Heart className="w-8 h-8 text-primary fill-primary mx-auto mb-2" />
          <CardTitle className="font-heading text-2xl">Create Your Profile</CardTitle>
          <CardDescription>Step {step + 1} of {steps.length} — {stepTitles[step]}</CardDescription>
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
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saving || !canProceed}>
                  {saving ? 'Creating...' : 'Complete Profile'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}