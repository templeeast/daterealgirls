import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Upload, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

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
    subscription_price: 4.99,
    max_photos: 3,
    bio_max_length: 500,
    free_tier_browse_limit: 25,
    msg_rate_limit_count: 5,
    msg_rate_limit_seconds: 10,
    primary_color: '',
    require_stripe_identity: false,
    stripe_identity_publishable_key: '',
    banner_show_women_only: true,
    payment_processor: 'whop',
    authorizenet_use_hosted_page: false,
    authorizenet_hosted_page_url: '',
    demo_mode: true,
    dev_mode: true,
    whop_men_plan_id: '',
    whop_women_plan_id: '',
    app_disabled: false,
    app_disabled_message: "The application is temporarily unavailable due to maintenance. We'll be back online shortly. Thank you for your patience.",
  });

  useEffect(() => {
    if (existingConfig) {
      setForm({
        site_name: existingConfig.site_name || '',
        tagline: existingConfig.tagline || '',
        target_audience: existingConfig.target_audience || '',
        logo_url: existingConfig.logo_url || '',
        subscription_price: existingConfig.subscription_price || 4.99,
        max_photos: existingConfig.max_photos || 3,
        bio_max_length: existingConfig.bio_max_length || 500,
        free_tier_browse_limit: existingConfig.free_tier_browse_limit ?? 25,
        msg_rate_limit_count: existingConfig.msg_rate_limit_count ?? 5,
        msg_rate_limit_seconds: existingConfig.msg_rate_limit_seconds ?? 10,
        primary_color: existingConfig.primary_color || '',
        require_stripe_identity: existingConfig.require_stripe_identity || false,
        stripe_identity_publishable_key: existingConfig.stripe_identity_publishable_key || '',
        banner_show_women_only: existingConfig.banner_show_women_only !== false,
        payment_processor: existingConfig.payment_processor || 'whop',
        authorizenet_use_hosted_page: existingConfig.authorizenet_use_hosted_page || false,
        authorizenet_hosted_page_url: existingConfig.authorizenet_hosted_page_url || '',
        demo_mode: existingConfig.demo_mode !== false,
        dev_mode: existingConfig.dev_mode !== false,
        whop_men_plan_id: existingConfig.whop_men_plan_id || '',
        whop_women_plan_id: existingConfig.whop_women_plan_id || '',
        app_disabled: existingConfig.app_disabled || false,
        app_disabled_message: existingConfig.app_disabled_message || "The application is temporarily unavailable due to maintenance. We'll be back online shortly. Thank you for your patience.",
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

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Pricing & Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subscription Price ($/month)</Label>
              <Input type="number" value={form.subscription_price} onChange={e => updateField('subscription_price', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Max Photos Per Profile</Label>
              <Input type="number" value={form.max_photos} onChange={e => updateField('max_photos', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Max Bio Length (characters)</Label>
              <Input type="number" value={form.bio_max_length} onChange={e => updateField('bio_max_length', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Free Tier Browse Limit (profiles)</Label>
              <Input type="number" value={form.free_tier_browse_limit} onChange={e => updateField('free_tier_browse_limit', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Number of profiles free-tier male members can see before being prompted to upgrade.</p>
            </div>
            <div className="space-y-2">
              <Label>Message Rate Limit — Max Messages</Label>
              <Input type="number" value={form.msg_rate_limit_count} onChange={e => updateField('msg_rate_limit_count', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Max messages a user can send within the time window below.</p>
            </div>
            <div className="space-y-2">
              <Label>Message Rate Limit — Time Window (seconds)</Label>
              <Input type="number" value={form.msg_rate_limit_seconds} onChange={e => updateField('msg_rate_limit_seconds', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Time window in seconds. Default: 5 messages per 10 seconds.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Identity Verification</CardTitle>
          <CardDescription>Require new users to verify their identity with Stripe during onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Require Stripe Identity Verification</p>
              <p className="text-xs text-muted-foreground mt-0.5">When enabled, a verification step is added to the onboarding flow for all new members.</p>
            </div>
            <Switch
              checked={form.require_stripe_identity}
              onCheckedChange={v => updateField('require_stripe_identity', v)}
            />
          </div>
          {form.require_stripe_identity && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Stripe Publishable Key</Label>
              <Input
                value={form.stripe_identity_publishable_key}
                onChange={e => updateField('stripe_identity_publishable_key', e.target.value)}
                placeholder="pk_live_..."
              />
              <p className="text-xs text-muted-foreground">Found in your Stripe dashboard under Developers → API keys.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Processor */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Payment Processors</CardTitle>
          <CardDescription>
            <strong>Whop</strong> is the primary processor. <strong>Authorize.net (PaymentCloud)</strong> is secondary. <strong>SegPay</strong> is the third option. <strong>CodaPay</strong> supports Southeast Asian local payment methods.
            Dev Mode (above) controls which API keys are used across all processors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Processor Shown to Users</Label>
            <Select value={form.payment_processor} onValueChange={v => updateField('payment_processor', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whop">Whop — Primary</SelectItem>
                <SelectItem value="authorizenet">Authorize.net (PaymentCloud) — Secondary</SelectItem>
                <SelectItem value="segpay">SegPay — Third</SelectItem>
                <SelectItem value="codapay">CodaPay — Asia / Local</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This controls which processor is shown to users on the subscription page.</p>
          </div>

          {/* Whop Config */}
          <div className="space-y-3 border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Whop</span>
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Primary</span>
            </div>
            <p className="text-xs text-muted-foreground">
              API keys are stored as secrets: <code className="bg-muted px-1 rounded">WHOP_DEV_API_KEY</code> and <code className="bg-muted px-1 rounded">WHOP_PROD_API_KEY</code>. Dev Mode (above) selects which key is used. Set your Plan IDs from the Whop Dashboard below.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Men's Plan ID (paid subscription)</Label>
                <Input
                  value={form.whop_men_plan_id}
                  onChange={e => updateField('whop_men_plan_id', e.target.value)}
                  placeholder="plan_xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">Product URL: https://whop.com/date-real-girls/date-real-girls-male-subscription</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Women's Plan ID (free plan)</Label>
                <Input
                  value={form.whop_women_plan_id}
                  onChange={e => updateField('whop_women_plan_id', e.target.value)}
                  placeholder="plan_xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">Product URL: https://whop.com/date-real-girls/date-real-girls-female-subscription</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Webhook URL: register <code className="bg-muted px-1 rounded">/api/functions/whopWebhook</code> in Whop Dashboard → Developer → Webhooks</p>
          </div>

          {/* Authorize.net Info */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Authorize.net / PaymentCloud</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Secondary</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Secrets: <code className="bg-muted px-1 rounded">AUTHORIZENET_API_LOGIN_ID</code> and <code className="bg-muted px-1 rounded">AUTHORIZENET_TRANSACTION_KEY</code>. Current keys are Dev/Sandbox. No Prod keys yet.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-xs">Use Hosted Payment Page</p>
                <p className="text-xs text-muted-foreground">Redirect users to Authorize.net hosted page instead of inline form.</p>
              </div>
              <Switch
                checked={form.authorizenet_use_hosted_page}
                onCheckedChange={v => updateField('authorizenet_use_hosted_page', v)}
              />
            </div>
          </div>

          {/* SegPay Info */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">SegPay</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Third</span>
            </div>
            <p className="text-xs text-muted-foreground">
              No API keys configured yet. Once you have SegPay credentials, add them as secrets and configure the integration.
            </p>
          </div>

          {/* CodaPay Info */}
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">CodaPay</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Asia / Local</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Secrets: <code className="bg-muted px-1 rounded">CODAPAY_PROJECT_ID</code>, <code className="bg-muted px-1 rounded">CODAPAY_SANDBOX_API_KEY</code>, <code className="bg-muted px-1 rounded">CODAPAY_PRODUCTION_API_KEY</code>.
              Dev Mode controls sandbox vs production. Supports PHP, THB, IDR, MYR, VND, SGD, TWD, USD.
            </p>
          </div>

          {/* Migration Tool */}
          <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Subscription Migration Tool</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flags all users with an old subscription as <strong>migrating</strong>, prompting them to re-subscribe on their next login. Save settings first before running.
                </p>
              </div>
            </div>
            {migrateResult && (
              <div className="text-xs bg-background rounded p-2 text-muted-foreground">{migrateResult}</div>
            )}
            <Button
              variant="destructive"
              size="sm"
              disabled={migrating}
              onClick={async () => {
                setMigrating(true);
                setMigrateResult(null);
                try {
                  const res = await base44.functions.invoke('migrateSubscriptions', {});
                  setMigrateResult(res.data?.message || 'Migration complete.');
                } catch (err) {
                  setMigrateResult('Migration failed: ' + (err?.response?.data?.error || err.message));
                }
                setMigrating(false);
              }}
            >
              {migrating ? 'Migrating…' : 'Run Migration Tool'}
            </Button>
          </div>
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