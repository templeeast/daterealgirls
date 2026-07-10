import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Save, AlertTriangle } from 'lucide-react';
import TokenEconomySettings from '@/components/admin/TokenEconomySettings';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: configs } = useQuery({
    queryKey: ['siteConfigAdmin'],
    queryFn: () => base44.entities.SiteConfig.list(),
    initialData: [],
  });

  const existingConfig = configs[0];

  const [form, setForm] = useState({
    site_name: '',
    tagline: '',
    target_audience: '',
    logo_url: '',
    max_photos: 3,
    max_private_photos: 10,
    bio_max_length: 500,
    msg_rate_limit_count: 5,
    msg_rate_limit_seconds: 10,
    primary_color: '',
    banner_show_women_only: true,
    payment_processor: 'whop',
    authorizenet_use_hosted_page: false,
    authorizenet_hosted_page_url: '',
    demo_mode: true,
    dev_mode: true,
    whop_men_plan_id: '',
    whop_women_plan_id: '',
    whop_checkout_email: 'drgpayments@clevo.testinator.com',
    whop_plan_starter: '',
    whop_plan_popular: '',
    whop_plan_value: '',
    whop_plan_best: '',
    whop_api_base_url: '',
    app_disabled: false,
    app_disabled_message: "The application is temporarily unavailable due to maintenance. We'll be back online shortly. Thank you for your patience.",
    juicyads_enabled: false,
    juicyads_api_key: '',
    juicyads_show_men: true,
    juicyads_show_women: false,
    juicyads_zone_browse: '',
    juicyads_zone_browse_mobile: '',
    juicyads_zone_profile: '',
    juicyads_zone_profile_mobile: '',
    juicyads_zone_messages: '',
    juicyads_zone_messages_mobile: '',
    juicyads_zone_winks: '',
    juicyads_zone_winks_mobile: '',
    juicyads_zone_favorites: '',
    juicyads_zone_favorites_mobile: '',
    adsterra_enabled: false,
    adsterra_show_men: true,
    adsterra_show_women: false,
    adsterra_key_browse: '',
    adsterra_key_browse_mobile: '',
    adsterra_key_profile: '',
    adsterra_key_profile_mobile: '',
    adsterra_key_messages: '',
    adsterra_key_messages_mobile: '',
    adsterra_key_winks: '',
    adsterra_key_winks_mobile: '',
    adsterra_key_favorites: '',
    adsterra_key_favorites_mobile: '',
    chat_retention_days: 90,
    welcome_tokens: 5000,
    first_purchase_bonus_men_enabled: true,
    first_purchase_bonus_men_tokens: 5000,
    first_purchase_bonus_women_enabled: false,
    first_purchase_bonus_women_tokens: 0,
    tokens_browse_men_enabled: true,
    tokens_browse_women_enabled: false,
    tokens_free_browse_limit: 25,
    tokens_browse_cost_men: 100,
    tokens_browse_cost_women: 0,
    tokens_msg_men_enabled: true,
    tokens_msg_women_enabled: false,
    tokens_msg_cost_men: 50,
    tokens_msg_cost_women: 0,
    tokens_verify_men_enabled: true,
    tokens_verify_women_enabled: true,
    tokens_verify_cost_men: 200,
    tokens_verify_cost_women: 200,
    token_pack_starter_tokens: 500,
    token_pack_starter_price: 5.99,
    token_pack_popular_tokens: 1500,
    token_pack_popular_price: 14.99,
    token_pack_value_tokens: 3500,
    token_pack_value_price: 29.99,
    token_pack_best_tokens: 8000,
    token_pack_best_price: 59.99,
    stripe_payment_link_enabled_men: false,
    stripe_payment_link_enabled_women: false,
    stripe_link_message_credit_cost: 5,
    tokens_wink_men_enabled: true,
    tokens_wink_cost_men: 5,
    tokens_wink_women_enabled: false,
    tokens_wink_cost_women: 0,
    videos_private_men_enabled: false,
    videos_private_women_enabled: false,
    videos_chat_men_enabled: false,
    videos_chat_women_enabled: false,
    max_video_duration_seconds: 30,
    max_video_file_size_mb: 25,
    tokens_msg_photo_cost: 5,
    tokens_private_photo_cost: 5,
    tokens_msg_video_cost_men: 10,
    tokens_msg_video_cost_women: 10,
    tokens_private_video_cost: 10,
  });

  useEffect(() => {
    if (existingConfig) {
      setForm({
        site_name: existingConfig.site_name || '',
        tagline: existingConfig.tagline || '',
        target_audience: existingConfig.target_audience || '',
        logo_url: existingConfig.logo_url || '',
        max_photos: existingConfig.max_photos || 3,
        max_private_photos: existingConfig.max_private_photos ?? 10,
        bio_max_length: existingConfig.bio_max_length || 500,
        msg_rate_limit_count: existingConfig.msg_rate_limit_count ?? 5,
        msg_rate_limit_seconds: existingConfig.msg_rate_limit_seconds ?? 10,
        primary_color: existingConfig.primary_color || '',
        banner_show_women_only: existingConfig.banner_show_women_only !== false,
        payment_processor: existingConfig.payment_processor || 'whop',
        authorizenet_use_hosted_page: existingConfig.authorizenet_use_hosted_page || false,
        authorizenet_hosted_page_url: existingConfig.authorizenet_hosted_page_url || '',
        demo_mode: existingConfig.demo_mode !== false,
        dev_mode: existingConfig.dev_mode !== false,
        whop_men_plan_id: existingConfig.whop_men_plan_id || '',
        whop_women_plan_id: existingConfig.whop_women_plan_id || '',
        whop_checkout_email: existingConfig.whop_checkout_email || 'drgpayments@clevo.testinator.com',
        whop_plan_starter: existingConfig.whop_plan_starter || '',
        whop_plan_popular: existingConfig.whop_plan_popular || '',
        whop_plan_value: existingConfig.whop_plan_value || '',
        whop_plan_best: existingConfig.whop_plan_best || '',
        whop_api_base_url: existingConfig.whop_api_base_url || '',
        app_disabled: existingConfig.app_disabled || false,
        app_disabled_message: existingConfig.app_disabled_message || "The application is temporarily unavailable due to maintenance. We'll be back online shortly. Thank you for your patience.",
        juicyads_enabled: existingConfig.juicyads_enabled || false,
        juicyads_api_key: existingConfig.juicyads_api_key || '',
        juicyads_show_men: existingConfig.juicyads_show_men !== false,
        juicyads_show_women: existingConfig.juicyads_show_women || false,
        juicyads_zone_browse: existingConfig.juicyads_zone_browse || '',
        juicyads_zone_browse_mobile: existingConfig.juicyads_zone_browse_mobile || '',
        juicyads_zone_profile: existingConfig.juicyads_zone_profile || '',
        juicyads_zone_profile_mobile: existingConfig.juicyads_zone_profile_mobile || '',
        juicyads_zone_messages: existingConfig.juicyads_zone_messages || '',
        juicyads_zone_messages_mobile: existingConfig.juicyads_zone_messages_mobile || '',
        juicyads_zone_winks: existingConfig.juicyads_zone_winks || '',
        juicyads_zone_winks_mobile: existingConfig.juicyads_zone_winks_mobile || '',
        juicyads_zone_favorites: existingConfig.juicyads_zone_favorites || '',
        juicyads_zone_favorites_mobile: existingConfig.juicyads_zone_favorites_mobile || '',
        adsterra_enabled: existingConfig.adsterra_enabled || false,
        adsterra_show_men: existingConfig.adsterra_show_men !== false,
        adsterra_show_women: existingConfig.adsterra_show_women || false,
        adsterra_key_browse: existingConfig.adsterra_key_browse || '',
        adsterra_key_browse_mobile: existingConfig.adsterra_key_browse_mobile || '',
        adsterra_key_profile: existingConfig.adsterra_key_profile || '',
        adsterra_key_profile_mobile: existingConfig.adsterra_key_profile_mobile || '',
        adsterra_key_messages: existingConfig.adsterra_key_messages || '',
        adsterra_key_messages_mobile: existingConfig.adsterra_key_messages_mobile || '',
        adsterra_key_winks: existingConfig.adsterra_key_winks || '',
        adsterra_key_winks_mobile: existingConfig.adsterra_key_winks_mobile || '',
        adsterra_key_favorites: existingConfig.adsterra_key_favorites || '',
        adsterra_key_favorites_mobile: existingConfig.adsterra_key_favorites_mobile || '',
        chat_retention_days: existingConfig.chat_retention_days ?? 90,
        welcome_tokens: existingConfig.welcome_tokens ?? 5000,
        first_purchase_bonus_men_enabled: existingConfig.first_purchase_bonus_men_enabled !== false,
        first_purchase_bonus_men_tokens: existingConfig.first_purchase_bonus_men_tokens ?? 5000,
        first_purchase_bonus_women_enabled: existingConfig.first_purchase_bonus_women_enabled || false,
        first_purchase_bonus_women_tokens: existingConfig.first_purchase_bonus_women_tokens ?? 0,
        tokens_browse_men_enabled: existingConfig.tokens_browse_men_enabled !== false,
        tokens_browse_women_enabled: existingConfig.tokens_browse_women_enabled || false,
        tokens_free_browse_limit: existingConfig.tokens_free_browse_limit ?? 25,
        tokens_browse_cost_men: existingConfig.tokens_browse_cost_men ?? 100,
        tokens_browse_cost_women: existingConfig.tokens_browse_cost_women ?? 0,
        tokens_msg_men_enabled: existingConfig.tokens_msg_men_enabled !== false,
        tokens_msg_women_enabled: existingConfig.tokens_msg_women_enabled || false,
        tokens_msg_cost_men: existingConfig.tokens_msg_cost_men ?? 50,
        tokens_msg_cost_women: existingConfig.tokens_msg_cost_women ?? 0,
        tokens_verify_men_enabled: existingConfig.tokens_verify_men_enabled !== false,
        tokens_verify_women_enabled: existingConfig.tokens_verify_women_enabled !== false,
        tokens_verify_cost_men: existingConfig.tokens_verify_cost_men ?? 200,
        tokens_verify_cost_women: existingConfig.tokens_verify_cost_women ?? 200,
        token_pack_starter_tokens: existingConfig.token_pack_starter_tokens ?? 500,
        token_pack_starter_price: existingConfig.token_pack_starter_price ?? 5.99,
        token_pack_popular_tokens: existingConfig.token_pack_popular_tokens ?? 1500,
        token_pack_popular_price: existingConfig.token_pack_popular_price ?? 14.99,
        token_pack_value_tokens: existingConfig.token_pack_value_tokens ?? 3500,
        token_pack_value_price: existingConfig.token_pack_value_price ?? 29.99,
        token_pack_best_tokens: existingConfig.token_pack_best_tokens ?? 8000,
        token_pack_best_price: existingConfig.token_pack_best_price ?? 59.99,
        stripe_payment_link_enabled_men: existingConfig.stripe_payment_link_enabled_men || false,
        stripe_payment_link_enabled_women: existingConfig.stripe_payment_link_enabled_women || false,
        stripe_link_message_credit_cost: existingConfig.stripe_link_message_credit_cost ?? 5,
        tokens_wink_men_enabled: existingConfig.tokens_wink_men_enabled !== false,
        tokens_wink_cost_men: existingConfig.tokens_wink_cost_men ?? 5,
        tokens_wink_women_enabled: existingConfig.tokens_wink_women_enabled || false,
        tokens_wink_cost_women: existingConfig.tokens_wink_cost_women ?? 0,
        videos_private_men_enabled: existingConfig.videos_private_men_enabled || false,
        videos_private_women_enabled: existingConfig.videos_private_women_enabled || false,
        videos_chat_men_enabled: existingConfig.videos_chat_men_enabled || false,
        videos_chat_women_enabled: existingConfig.videos_chat_women_enabled || false,
        max_video_duration_seconds: existingConfig.max_video_duration_seconds ?? 30,
        max_video_file_size_mb: existingConfig.max_video_file_size_mb ?? 25,
        tokens_msg_photo_cost: existingConfig.tokens_msg_photo_cost ?? 5,
        tokens_private_photo_cost: existingConfig.tokens_private_photo_cost ?? 5,
        tokens_msg_video_cost_men: existingConfig.tokens_msg_video_cost_men ?? 10,
        tokens_msg_video_cost_women: existingConfig.tokens_msg_video_cost_women ?? 10,
        tokens_private_video_cost: existingConfig.tokens_private_video_cost ?? 10,
      });
    }
  }, [existingConfig]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('logo_url', file_url);
  };

  const handleSave = async () => {
    setSaving(true);
    if (existingConfig) {
      await base44.entities.SiteConfig.update(existingConfig.id, form);
    } else {
      await base44.entities.SiteConfig.create(form);
    }
    queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
    queryClient.invalidateQueries({ queryKey: ['siteConfigAdmin'] });
    toast({ title: 'Settings saved!' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Branding</CardTitle>
          <CardDescription>Configure the site name, logo, and messaging for your domain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Site Name</Label>
            <Input value={form.site_name} onChange={e => updateField('site_name', e.target.value)} placeholder="e.g. DateRealGirls.com" />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="Where Real Connections Begin" />
          </div>
          <div className="space-y-2">
            <Label>Target Audience Description</Label>
            <Textarea value={form.target_audience} onChange={e => updateField('target_audience', e.target.value)} placeholder="Describe your target audience..." />
          </div>
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="h-12 w-auto rounded" />
              )}
              <label>
                <Button variant="outline" className="gap-2" asChild>
                  <span><Upload className="w-4 h-4" /> Upload Logo</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Primary Color (hex)</Label>
            <Input value={form.primary_color} onChange={e => updateField('primary_color', e.target.value)} placeholder="#E8336D" />
          </div>
        </CardContent>
      </Card>

      {/* Landing Page */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Landing Page</CardTitle>
          <CardDescription>Control what visitors see on the public landing page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Beta / Demo Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Shows a prominent "Beta Mode — launching soon" banner at the top of the landing page.</p>
            </div>
            <Switch
              checked={form.demo_mode}
              onCheckedChange={v => updateField('demo_mode', v)}
            />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">🔧 Dev Mode (Sandbox/Test Keys)</p>
              <p className="text-xs text-muted-foreground mt-0.5">When ON, all payment processors use sandbox/dev API keys. A yellow "DEV MODE" banner is shown on the landing page. Turn OFF for production.</p>
            </div>
            <Switch
              checked={form.dev_mode}
              onCheckedChange={v => updateField('dev_mode', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Show Women Only in Scrolling Banner</p>
              <p className="text-xs text-muted-foreground mt-0.5">When enabled, only female profiles appear in the animated banner. When off, all genders are shown.</p>
            </div>
            <Switch
              checked={form.banner_show_women_only}
              onCheckedChange={v => updateField('banner_show_women_only', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Public Photos Per Profile</Label>
              <Input type="number" value={form.max_photos} onChange={e => updateField('max_photos', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Max Private Photos Per Profile</Label>
              <Input type="number" value={form.max_private_photos} onChange={e => updateField('max_private_photos', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Max Bio Length (characters)</Label>
              <Input type="number" value={form.bio_max_length} onChange={e => updateField('bio_max_length', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Message Rate Limit — Max Messages</Label>
              <Input type="number" value={form.msg_rate_limit_count} onChange={e => updateField('msg_rate_limit_count', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Message Rate Limit — Time Window (seconds)</Label>
              <Input type="number" value={form.msg_rate_limit_seconds} onChange={e => updateField('msg_rate_limit_seconds', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Chat Message Retention (days)</Label>
              <Input type="number" value={form.chat_retention_days} onChange={e => updateField('chat_retention_days', Number(e.target.value))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Economy */}
      <TokenEconomySettings form={form} updateField={updateField} />

      {/* Monetization — Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Monetization — Embedded Ads</CardTitle>
          <CardDescription>JuicyAds or other ad network. When enabled, ads appear on women's profile pages when viewed by men.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Embedded Ads (JuicyAds)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Shows banner/video ads on women's profiles. Requires a JuicyAds API key below.</p>
            </div>
            <Switch
              checked={form.juicyads_enabled}
              onCheckedChange={v => updateField('juicyads_enabled', v)}
            />
          </div>
          {form.juicyads_enabled && (
            <div className="space-y-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>JuicyAds API Key</Label>
                <Input
                  value={form.juicyads_api_key}
                  onChange={e => updateField('juicyads_api_key', e.target.value)}
                  placeholder="Enter your JuicyAds API key..."
                />
                <p className="text-xs text-muted-foreground">Get your API key from JuicyAds Dashboard → Account Settings → API Keys.</p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold">Audience — Who Sees Ads</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show Ads to Men</p>
                    <p className="text-xs text-muted-foreground">Recommended — men are the paying audience</p>
                  </div>
                  <Switch checked={form.juicyads_show_men} onCheckedChange={v => updateField('juicyads_show_men', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Show Ads to Women</p>
                  </div>
                  <Switch checked={form.juicyads_show_women} onCheckedChange={v => updateField('juicyads_show_women', v)} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold">Zone / Spot IDs by Page</p>
                <p className="text-xs text-muted-foreground">Recommended sizes — Desktop: <strong>728×90</strong> (Leaderboard), Mobile: <strong>300×100</strong> (Mobile Ads). Available JuicyAds banner types: 728×90 Leaderboard, 300×100 Mobile, 300×50 Mobile, 468×60 Banner, 160×600 Skyscraper, 300×250.</p>
                {[
                  { label: 'Browse Page', deskField: 'juicyads_zone_browse', mobField: 'juicyads_zone_browse_mobile' },
                  { label: 'Messages Page', deskField: 'juicyads_zone_messages', mobField: 'juicyads_zone_messages_mobile' },
                  { label: 'Winks Page', deskField: 'juicyads_zone_winks', mobField: 'juicyads_zone_winks_mobile' },
                  { label: 'Favorites Page', deskField: 'juicyads_zone_favorites', mobField: 'juicyads_zone_favorites_mobile' },
                  { label: 'Profile Page', deskField: 'juicyads_zone_profile', mobField: 'juicyads_zone_profile_mobile' },
                ].map(({ label, deskField, mobField }) => (
                  <div key={deskField} className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{label} — Desktop Zone (728×90)</Label>
                      <Input value={form[deskField]} onChange={e => updateField(deskField, e.target.value)} placeholder="e.g. 123456" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{label} — Mobile Zone (300×100)</Label>
                      <Input value={form[mobField]} onChange={e => updateField(mobField, e.target.value)} placeholder="e.g. 123457" />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Zone IDs are found in your JuicyAds Dashboard → My Spots. Leave a zone blank to disable the ad on that page. When a mobile zone is blank, the desktop zone is served on mobile screens as fallback.</p>
              </div>
            </div>
          )}

          {/* Adsterra */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Enable Adsterra Ads</p>
                <p className="text-xs text-muted-foreground mt-0.5">Shows Adsterra banner ads alongside JuicyAds on the same pages. Enter ad unit keys from your Adsterra dashboard.</p>
              </div>
              <Switch
                checked={form.adsterra_enabled}
                onCheckedChange={v => updateField('adsterra_enabled', v)}
              />
            </div>
            {form.adsterra_enabled && (
              <div className="space-y-4 pt-2">
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-semibold">Audience — Who Sees Adsterra Ads</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Ads to Men</p>
                      <p className="text-xs text-muted-foreground">Recommended — men are the paying audience</p>
                    </div>
                    <Switch checked={form.adsterra_show_men} onCheckedChange={v => updateField('adsterra_show_men', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Ads to Women</p>
                    </div>
                    <Switch checked={form.adsterra_show_women} onCheckedChange={v => updateField('adsterra_show_women', v)} />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-semibold">Ad Unit Keys by Page</p>
                  <p className="text-xs text-muted-foreground">Recommended sizes — Desktop: <strong>728×90</strong> (Leaderboard), Mobile: <strong>320×50</strong> (Mobile Banner). Available sizes from Adsterra: 468×60, 160×300, 320×50, 300×250, 160×600, 728×90.</p>
                  {[
                    { label: 'Browse Page', deskField: 'adsterra_key_browse', mobField: 'adsterra_key_browse_mobile' },
                    { label: 'Messages Page', deskField: 'adsterra_key_messages', mobField: 'adsterra_key_messages_mobile' },
                    { label: 'Winks Page', deskField: 'adsterra_key_winks', mobField: 'adsterra_key_winks_mobile' },
                    { label: 'Favorites Page', deskField: 'adsterra_key_favorites', mobField: 'adsterra_key_favorites_mobile' },
                    { label: 'Profile Page', deskField: 'adsterra_key_profile', mobField: 'adsterra_key_profile_mobile' },
                  ].map(({ label, deskField, mobField }) => (
                    <div key={deskField} className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">{label} — Desktop Key (728×90)</Label>
                        <Input value={form[deskField]} onChange={e => updateField(deskField, e.target.value)} placeholder="e.g. a1b2c3d4e5f6g7h8" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">{label} — Mobile Key (320×50)</Label>
                        <Input value={form[mobField]} onChange={e => updateField(mobField, e.target.value)} placeholder="e.g. a1b2c3d4e5f6g7h8" />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Find your ad unit keys in Adsterra Dashboard → Ad Units. Leave a key blank to disable the ad on that page.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Processor */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Payment Processors</CardTitle>
          <CardDescription>
            <strong>Whop</strong>, <strong>Authorize.net (ZenPayments)</strong>, and <strong>CodaPay</strong> are available processors for token pack purchases. Select the active one below.
            Dev Mode (above) controls which API keys are used across all processors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Processor Shown to Users</Label>
            <Select value={form.payment_processor} onValueChange={v => updateField('payment_processor', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whop">Whop</SelectItem>
                <SelectItem value="authorizenet">Authorize.net (ZenPayments)</SelectItem>
                <SelectItem value="codapay">CodaPay — Asia / Local</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This controls which processor handles token pack purchases.</p>
          </div>

          {/* Whop Config */}
          <div className={`space-y-3 rounded-lg p-4 ${form.payment_processor === 'whop' ? 'border-2 border-primary/20 bg-primary/5' : 'border'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Whop</span>
              {form.payment_processor === 'whop' && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Primary</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              API keys: <code className="bg-muted px-1 rounded">WHOP_DEV_API_KEY</code> / <code className="bg-muted px-1 rounded">WHOP_PROD_API_KEY</code>.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Men's Plan ID (Subscription)</Label>
                <Input value={form.whop_men_plan_id} onChange={e => updateField('whop_men_plan_id', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Women's Plan ID (Subscription)</Label>
                <Input value={form.whop_women_plan_id} onChange={e => updateField('whop_women_plan_id', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1 border-t pt-3">
                <Label className="text-xs font-semibold">Token Pack Plan IDs</Label>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Checkout Email (pre-filled in Whop checkout)</Label>
                <Input value={form.whop_checkout_email} onChange={e => updateField('whop_checkout_email', e.target.value)} placeholder="drgpayments@clevo.testinator.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Whop Plan ID — Starter</Label>
                <Input value={form.whop_plan_starter} onChange={e => updateField('whop_plan_starter', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Whop Plan ID — Popular</Label>
                <Input value={form.whop_plan_popular} onChange={e => updateField('whop_plan_popular', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Whop Plan ID — Value</Label>
                <Input value={form.whop_plan_value} onChange={e => updateField('whop_plan_value', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Whop Plan ID — Best Deal</Label>
                <Input value={form.whop_plan_best} onChange={e => updateField('whop_plan_best', e.target.value)} placeholder="plan_xxxxxxxxxxxx" />
              </div>
              <div className="space-y-1 border-t pt-3">
                <Label className="text-xs font-semibold">API Base URL</Label>
                <Input
                  value={form.whop_api_base_url}
                  onChange={e => updateField('whop_api_base_url', e.target.value)}
                  placeholder="https://sandbox-api.whop.com or https://api.whop.com"
                />
                <p className="text-xs text-muted-foreground">Leave blank to use the default based on Dev Mode. Sandbox: <code className="bg-muted px-1 rounded">https://sandbox-api.whop.com</code> — Production: <code className="bg-muted px-1 rounded">https://api.whop.com</code></p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Subscription Webhook URL: <code className="bg-muted px-1 rounded">/api/functions/whopWebhook</code></p>
            <p className="text-xs text-muted-foreground">Token Payment Webhook URL: <code className="bg-muted px-1 rounded">/api/functions/whopPaymentWebhook</code></p>
          </div>

          {/* Authorize.net Info */}
          <div className={`space-y-3 rounded-lg p-4 ${form.payment_processor === 'authorizenet' ? 'border-2 border-primary/20 bg-primary/5' : 'border'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Authorize.net / ZenPayments</span>
              {form.payment_processor === 'authorizenet' && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Primary</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Secrets: <code className="bg-muted px-1 rounded">AUTHORIZENET_API_LOGIN_ID</code> and <code className="bg-muted px-1 rounded">AUTHORIZENET_TRANSACTION_KEY</code>.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-xs">Use Hosted Payment Page</p>
              </div>
              <Switch checked={form.authorizenet_use_hosted_page} onCheckedChange={v => updateField('authorizenet_use_hosted_page', v)} />
            </div>
          </div>

          {/* CodaPay Info */}
          <div className={`space-y-3 rounded-lg p-4 ${form.payment_processor === 'codapay' ? 'border-2 border-primary/20 bg-primary/5' : 'border'}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">CodaPay</span>
              {form.payment_processor === 'codapay' ? <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Primary</span> : <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Asia / Local</span>}
            </div>
            <p className="text-xs text-muted-foreground">
              Secrets: <code className="bg-muted px-1 rounded">CODAPAY_PROJECT_ID</code>, <code className="bg-muted px-1 rounded">CODAPAY_SANDBOX_API_KEY</code>, <code className="bg-muted px-1 rounded">CODAPAY_PRODUCTION_API_KEY</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Didit Identity Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Didit Identity Verification</CardTitle>
          <CardDescription>
            Hosted identity verification (document scan + liveness). Credentials are stored as Base44 Secrets and selected by Dev Mode above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            DEV secrets:{" "}
            <code className="bg-muted px-1 rounded">DIDIT_API_KEY_DEV</code>,{" "}
            <code className="bg-muted px-1 rounded">DIDIT_WORKFLOW_ID_DEV</code>,{" "}
            <code className="bg-muted px-1 rounded">DIDIT_WEBHOOK_SECRET_DEV</code>
          </p>
          <p className="text-xs text-muted-foreground">
            PROD secrets:{" "}
            <code className="bg-muted px-1 rounded">DIDIT_API_KEY_PROD</code>,{" "}
            <code className="bg-muted px-1 rounded">DIDIT_WORKFLOW_ID_PROD</code>,{" "}
            <code className="bg-muted px-1 rounded">DIDIT_WEBHOOK_SECRET_PROD</code>
          </p>
          <p className="text-xs text-muted-foreground">
            Webhook URL: <code className="bg-muted px-1 rounded">/api/webhooks/didit</code>
          </p>
          <p className="text-xs text-muted-foreground">
            Callback URL: <code className="bg-muted px-1 rounded">/verify/complete</code>
          </p>
        </CardContent>
      </Card>

      {/* Emergency Disable */}
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Emergency Disable Switch
          </CardTitle>
          <CardDescription className="text-destructive/80">
            Disabling the app will make it inaccessible for all non-admin users. Use with caution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-background rounded-lg p-4 border">
            <p className="font-semibold text-sm">Disable Application</p>
            <Switch
              checked={form.app_disabled}
              onCheckedChange={v => updateField('app_disabled', v)}
            />
          </div>
          {form.app_disabled && (
            <div className="space-y-2">
              <Label>Disabled App Message</Label>
              <Textarea
                value={form.app_disabled_message}
                onChange={e => updateField('app_disabled_message', e.target.value)}
                rows={3}
                placeholder="The application is temporarily unavailable..."
              />
              <p className="text-xs text-destructive">⚠️ The app is currently DISABLED. Save settings to apply.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button className="w-full gap-2 rounded-full" size="lg" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}