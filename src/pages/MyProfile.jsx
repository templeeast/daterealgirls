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
import { Upload, Shield, Camera, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import StripeIdentityCard from '@/components/profile/StripeIdentityCard';

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
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.MemberProfile.update(profile.id, {
      id_document_url: file_url,
      verification_status: 'pending',
    });
    toast({ title: 'ID submitted for verification' });
    refetch();
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.MemberProfile.update(profile.id, form);
    queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    toast({ title: 'Profile updated!' });
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
      <h1 className="font-heading text-3xl font-bold mb-6">My Profile</h1>

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
                  ID Verification
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile.verification_status === 'unverified' && 'Upload your government ID to get verified'}
                  {profile.verification_status === 'pending' && 'Your ID is being reviewed by our team'}
                  {profile.verification_status === 'verified' && 'Your identity has been verified'}
                  {profile.verification_status === 'rejected' && 'Your verification was rejected. Please try again.'}
                </p>
              </div>
              <Badge className={verificationColors[profile.verification_status]}>
                {profile.verification_status}
              </Badge>
            </div>
            {(profile.verification_status === 'unverified' || profile.verification_status === 'rejected') && (
              <label className="mt-4 block">
                <Button variant="outline" className="gap-2" asChild>
                  <span>
                    <Upload className="w-4 h-4" /> Upload Government ID
                  </span>
                </Button>
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdUpload} />
              </label>
            )}
          </CardContent>
        </Card>
      )}

      {/* Subscription Info (for men) */}
      {profile.gender === 'male' && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-semibold mb-2">Subscription</h3>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="capitalize">{profile.subscription_status}</Badge>
              {profile.trial_end_date && profile.subscription_status === 'trial' && (
                <span className="text-sm text-muted-foreground">Trial ends: {profile.trial_end_date}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" /> Photos
          </CardTitle>
          <CardDescription>Upload up to {config.max_photos || 3} photos</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={form.display_name} onChange={e => updateField('display_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio <span className="text-muted-foreground text-xs">({form.bio.length}/{config.bio_max_length || 500})</span></Label>
            <Textarea
              value={form.bio}
              onChange={e => updateField('bio', e.target.value.slice(0, config.bio_max_length || 500))}
              className="h-32"
              placeholder="Tell people about yourself..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={form.location_city} onChange={e => updateField('location_city', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={form.location_country} onChange={e => updateField('location_country', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Looking For</Label>
            <Select value={form.looking_for} onValueChange={v => updateField('looking_for', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Social */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Social Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram</Label>
            <Input placeholder="username" value={form.instagram} onChange={e => updateField('instagram', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Facebook</Label>
            <Input placeholder="Profile link" value={form.facebook} onChange={e => updateField('facebook', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>TikTok</Label>
            <Input placeholder="username" value={form.tiktok} onChange={e => updateField('tiktok', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <Button className="w-full gap-2 rounded-full" size="lg" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}