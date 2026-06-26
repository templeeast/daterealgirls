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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Upload, Shield, Camera, Save, Trash2, Eye, EyeOff, AlertTriangle, Smile, ExternalLink, Coins, ShoppingCart, CreditCard, Lock, Loader2, History } from 'lucide-react';
import WhopTokenCheckout from '@/components/subscription/WhopTokenCheckout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, th, zhCN, de, vi as viLocale, pt } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import StripeIdentityCard from '@/components/profile/StripeIdentityCard';
import DiditVerificationCard from '@/components/profile/DiditVerificationCard';
import CountryCitySelector from '@/components/shared/CountryCitySelector';
import PrivatePhotosSection from '@/components/profile/PrivatePhotosSection';

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

  const [saving, setSaving] = useState(false);
  const [editingTagId, setEditingTagId] = useState(false);
  const [tagIdInput, setTagIdInput] = useState('');
  const [tagIdSaving, setTagIdSaving] = useState(false);
  const [tagIdError, setTagIdError] = useState('');

  const [form, setForm] = useState(null);
  const [winks, setWinks] = useState(null);

  // Token purchase dialog state
  const [buyDialog, setBuyDialog] = useState({ open: false, pack: null });
  const [showWhopCheckout, setShowWhopCheckout] = useState(false);
  const [whopPackName, setWhopPackName] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [purchasePromoCode, setPurchasePromoCode] = useState('');
  const [purchasing, setPurchasing] = useState(false);

  const packNameMap = {
    'Starter Pack': 'starter',
    'Popular Pack': 'popular',
    'Value Pack': 'value',
    'Best Deal Pack': 'best',
  };

  // Verification promo code state
  const [verifPromoCode, setVerifPromoCode] = useState('');
  const [applyingVerifPromo, setApplyingVerifPromo] = useState(false);

  // General promo code state
  const [generalPromoCode, setGeneralPromoCode] = useState('');
  const [applyingGeneralPromo, setApplyingGeneralPromo] = useState(false);

  const handleBuyTokens = (pack) => {
    if (config.payment_processor === 'whop') {
      const pn = packNameMap[pack.name] || 'starter';
      setWhopPackName(pn);
      setShowWhopCheckout(true);
    } else {
      setBuyDialog({ open: true, pack });
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setPurchasePromoCode('');
    }
  };

  const handleWhopComplete = () => {
    setShowWhopCheckout(false);
    toast({ title: 'Purchase complete! Your tokens will appear shortly.' });
    setTimeout(() => refetch(), 3000);
  };

  const handleApplyVerifPromo = async () => {
    if (!verifPromoCode.trim()) return;
    setApplyingVerifPromo(true);
    try {
      const res = await base44.functions.invoke('applyVerificationPromo', { promoCode: verifPromoCode.trim() });
      if (res.data?.success) {
        if (res.data?.pending) {
          toast({ title: res.data.message || 'Promo applied! Tokens will be awarded on your first purchase.' });
        } else {
          toast({ title: `🎉 ${res.data.bonusTokens.toLocaleString()} bonus tokens added!` });
          refetch();
        }
        setVerifPromoCode('');
      } else {
        toast({ title: res.data?.error || 'Invalid promo code', variant: 'destructive' });
      }
    } finally {
      setApplyingVerifPromo(false);
    }
  };

  const handleApplyGeneralPromo = async () => {
    if (!generalPromoCode.trim()) return;
    setApplyingGeneralPromo(true);
    try {
      const res = await base44.functions.invoke('applyVerificationPromo', { promoCode: generalPromoCode.trim() });
      if (res.data?.success) {
        if (res.data?.pending) {
          toast({ title: res.data.message || 'Promo applied! Tokens will be awarded on your first purchase.' });
        } else {
          toast({ title: `🎉 ${res.data.bonusTokens.toLocaleString()} bonus tokens added!` });
          refetch();
        }
        setGeneralPromoCode('');
      } else {
        toast({ title: res.data?.error || 'Invalid promo code', variant: 'destructive' });
      }
    } finally {
      setApplyingGeneralPromo(false);
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!cardNumber || !cardExpiry || !cardCvv) {
      toast({ title: 'Please fill in all card details', variant: 'destructive' });
      return;
    }
    setPurchasing(true);
    const res = await base44.functions.invoke('purchaseTokens', {
      cardNumber,
      cardExpiry,
      cardCvv,
      amount: buyDialog.pack.price,
      packName: buyDialog.pack.name,
      tokensToAdd: buyDialog.pack.tokens,
      promoCode: purchasePromoCode.trim() || null,
    });
    setPurchasing(false);
    if (res.data?.success) {
      const bonus = res.data?.bonusTokens;
      const msg = bonus > 0
        ? `Purchased ${buyDialog.pack.tokens.toLocaleString()} tokens + ${bonus.toLocaleString()} bonus tokens!`
        : `Purchased ${buyDialog.pack.tokens.toLocaleString()} tokens!`;
      toast({ title: msg });
      setBuyDialog({ open: false, pack: null });
      refetch();
    } else {
      toast({ title: res.data?.error || 'Payment failed', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (profile?.id && winks === null) {
      base44.entities.Wink.filter({ recipient_profile_id: profile.id }).then(setWinks);
    }
  }, [profile?.id]);

  // Auto-generate tag_id if missing
  useEffect(() => {
    if (profile && !profile.tag_id) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const newTagId = `@DRG-${rand}`;
      base44.entities.MemberProfile.update(profile.id, { tag_id: newTagId });
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
        show_tag_id: profile.show_tag_id !== false,
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
        } else {
          toast({ title: res.data?.error || 'Upload failed', variant: 'destructive' });
        }
      } catch {
        toast({ title: 'Upload failed. Please try again.', variant: 'destructive' });
      }
    };
    reader.readAsDataURL(file);
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

  const handleEditTagId = () => {
    setTagIdInput(profile.tag_id || '');
    setTagIdError('');
    setEditingTagId(true);
  };

  const handleSaveTagId = async () => {
    const raw = tagIdInput.trim().toUpperCase();
    // Enforce @DRG- prefix
    const formatted = raw.startsWith('@DRG-') ? raw : `@DRG-${raw.replace(/^@/, '')}`;
    const suffix = formatted.replace('@DRG-', '');
    if (!/^[A-Z0-9]{3,10}$/.test(suffix)) {
      setTagIdError('Tag must be 3–10 letters/numbers after @DRG-');
      return;
    }
    setTagIdSaving(true);
    setTagIdError('');
    // Check uniqueness
    const existing = await base44.entities.MemberProfile.filter({ tag_id: formatted });
    const takenByOther = existing.filter(p => p.id !== profile.id);
    if (takenByOther.length > 0) {
      setTagIdError('That tag is already taken. Please choose another.');
      setTagIdSaving(false);
      return;
    }
    await base44.entities.MemberProfile.update(profile.id, { tag_id: formatted });
    toast({ title: 'Member tag updated!' });
    setEditingTagId(false);
    setTagIdSaving(false);
    refetch();
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
      <h1 className="font-heading text-3xl font-bold mb-6">{t('my_profile_title')}</h1>

      {/* Token Balance */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Balance</p>
                <p className="text-3xl font-bold">{(profile.tokens ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="rounded-full gap-2" onClick={() => document.getElementById('buy-tokens')?.scrollIntoView({ behavior: 'smooth' })}>
                <ShoppingCart className="w-4 h-4" /> Buy Tokens
              </Button>
              <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => navigate('/payment-history')}>
                <History className="w-4 h-4" /> History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incomplete profile banner */}
      {(!profile.profile_complete || profile.didit_verification_status !== 'Approved') && (
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
        <DiditVerificationCard profile={profile} onRefetch={refetch} />
      )}

      {/* Verification Promo Code */}
      {profile.verification_status === 'verified' && !profile.used_promo_codes?.includes('LAUNCH26') && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-semibold text-green-800">Verified! Claim your bonus tokens</p>
                <p className="text-sm text-green-700">Enter promo code <span className="font-mono font-bold">LAUNCH26</span> below to receive 5,000 free tokens.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter LAUNCH26"
                value={verifPromoCode}
                onChange={e => setVerifPromoCode(e.target.value.toUpperCase())}
                className="font-mono flex-1"
              />
              <Button onClick={handleApplyVerifPromo} disabled={applyingVerifPromo || !verifPromoCode.trim()} className="shrink-0">
                {applyingVerifPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Promo Code */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">🎁</span>
            <div>
              <p className="font-semibold text-blue-800">Have a promo code?</p>
              <p className="text-sm text-blue-700">Enter any promo code to claim bonus tokens.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter promo code"
              value={generalPromoCode}
              onChange={e => setGeneralPromoCode(e.target.value.toUpperCase())}
              className="font-mono flex-1"
            />
            <Button onClick={handleApplyGeneralPromo} disabled={applyingGeneralPromo || !generalPromoCode.trim()} className="shrink-0">
              {applyingGeneralPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Buy Tokens */}
      <Card id="buy-tokens" className="mb-6 scroll-mt-20">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> Buy Tokens
          </CardTitle>
          <CardDescription>Purchase tokens to browse more profiles, send messages, and verify your identity.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Promo Code Banner */}
          <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4">
            <span className="text-2xl">🎁</span>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Use Promo Code <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">FUNDATES</span> with your first token purchase to get <strong>1,000 free tokens</strong>.</p>
              <p className="text-sm">Use Promo Code <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">LAUNCH26</span> after ID Verification to get an additional <strong>5,000 free tokens</strong>.</p>
              <p className="text-sm">Use Promo Code <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">GODATE26</span> as a profile completion welcome bonus for <strong>1,000 free tokens</strong>.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { name: 'Starter Pack', tokens: config.token_pack_starter_tokens ?? 500, price: config.token_pack_starter_price ?? 5.99 },
              { name: 'Popular Pack', tokens: config.token_pack_popular_tokens ?? 1500, price: config.token_pack_popular_price ?? 14.99, badge: 'Most Popular', highlight: true },
              { name: 'Value Pack', tokens: config.token_pack_value_tokens ?? 3500, price: config.token_pack_value_price ?? 29.99 },
              { name: 'Best Deal Pack', tokens: config.token_pack_best_tokens ?? 8000, price: config.token_pack_best_price ?? 59.99, badge: 'Best Value' },
            ].map(pack => (
              <div key={pack.name} className={`border rounded-xl p-4 text-center relative ${pack.highlight ? 'border-primary shadow-sm shadow-primary/10 bg-primary/5' : ''}`}>
                {pack.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">{pack.badge}</span>
                )}
                <p className="text-2xl font-bold mt-1">{pack.tokens.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mb-2">tokens</p>
                <p className="text-xl font-bold text-primary mb-3">${pack.price}</p>
                <Button size="sm" className="w-full rounded-full" variant={pack.highlight ? 'default' : 'outline'} onClick={() => handleBuyTokens(pack)}>
                  Buy {pack.name}
                </Button>
              </div>
            ))}
          </div>

          {/* Cost Breakdown */}
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold mb-3">Token Costs</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('token_cost_browse_free', { n: config.tokens_free_browse_limit ?? 25 })}</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between">
                <span>{t('token_cost_browse_all')} (1 week)</span>
                <span>{profile.gender === 'male' ? (config.tokens_browse_cost_men ?? 100) : (config.tokens_browse_cost_women ?? 0)} tokens</span>
              </div>
              <div className="flex justify-between">
                <span>{t('token_cost_send_message')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span></span>
                <span>{profile.gender === 'male' ? (config.tokens_msg_cost_men ?? 2) : (config.tokens_msg_cost_women ?? 0)} tokens</span>
              </div>
              <div className="flex justify-between">
                <span>{t('token_cost_view_private_photos')} <span className="text-xs text-amber-600 font-medium">({t('token_cost_verification_required')})</span></span>
                <span>{profile.gender === 'male' ? '5 tokens / photo' : 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span>ID Verification</span>
                <span>{profile.gender === 'male' ? (config.tokens_verify_cost_men ?? 200) : (config.tokens_verify_cost_women ?? 200)} tokens</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Private Photos */}
      <PrivatePhotosSection profile={profile} onRefetch={refetch} />

      {/* Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">{t('profile_info_title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member Tag ID */}
          <div className="bg-muted rounded-xl px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Your Member Tag ID</p>
                {editingTagId ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm text-muted-foreground">@DRG-</span>
                    <Input
                      className="font-mono font-bold h-8 w-36 text-sm"
                      value={tagIdInput.replace(/^@DRG-/i, '')}
                      onChange={e => { setTagIdInput(`@DRG-${e.target.value.toUpperCase()}`); setTagIdError(''); }}
                      maxLength={14}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveTagId} disabled={tagIdSaving}>
                      {tagIdSaving ? 'Saving…' : 'Save'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingTagId(false); setTagIdError(''); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono font-bold text-lg text-foreground">{profile.tag_id || '...'}</p>
                    <button onClick={handleEditTagId} className="text-xs text-primary hover:underline">Edit</button>
                  </div>
                )}
                {tagIdError && <p className="text-xs text-destructive mt-1">{tagIdError}</p>}
              </div>
              {!editingTagId && <div className="text-xs text-muted-foreground text-right max-w-[140px]">Share this so others can find you easily</div>}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-sm text-muted-foreground">Show on public profile</span>
              <Switch
                checked={form.show_tag_id !== false}
                onCheckedChange={async v => {
                  setForm(f => ({ ...f, show_tag_id: v }));
                  await base44.entities.MemberProfile.update(profile.id, { show_tag_id: v });
                }}
              />
            </div>
          </div>
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

      {/* Whop Checkout Modal */}
      {showWhopCheckout && (
        <WhopTokenCheckout
          packName={whopPackName}
          devMode={config.dev_mode === true}
          onClose={() => setShowWhopCheckout(false)}
          onComplete={handleWhopComplete}
        />
      )}

      {/* Buy Tokens Dialog (non-Whop processors) */}
      <Dialog open={buyDialog.open} onOpenChange={(v) => !v && setBuyDialog({ open: false, pack: null })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" /> Buy {buyDialog.pack?.name}
            </DialogTitle>
            <DialogDescription>
              {buyDialog.pack?.tokens?.toLocaleString()} tokens for ${buyDialog.pack?.price}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Card Number</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  maxLength={19}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Expiry</Label>
                <Input
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={e => setCardExpiry(e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="space-y-1.5">
                <Label>CVV</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="123"
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Your payment info is encrypted and secure. Powered by Authorize.net.</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBuyDialog({ open: false, pack: null })} disabled={purchasing}>
              Cancel
            </Button>
            <Button onClick={handlePurchaseSubmit} disabled={purchasing} className="gap-2">
              {purchasing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>Pay ${buyDialog.pack?.price}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}