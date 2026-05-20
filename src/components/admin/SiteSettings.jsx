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
    subscription_price: 5,
    max_photos: 3,
    bio_max_length: 500,
    primary_color: '',
    require_stripe_identity: false,
    stripe_identity_publishable_key: '',
    banner_show_women_only: true,
    payment_processor: 'stripe',
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_price_id: '',
    paymentnerds_api_key: '',
    paymentnerds_merchant_id: '',
  });

  useEffect(() => {
    if (existingConfig) {
      setForm({
        site_name: existingConfig.site_name || '',
        tagline: existingConfig.tagline || '',
        target_audience: existingConfig.target_audience || '',
        logo_url: existingConfig.logo_url || '',
        subscription_price: existingConfig.subscription_price || 5,
        max_photos: existingConfig.max_photos || 3,
        bio_max_length: existingConfig.bio_max_length || 500,
        primary_color: existingConfig.primary_color || '',
        require_stripe_identity: existingConfig.require_stripe_identity || false,
        stripe_identity_publishable_key: existingConfig.stripe_identity_publishable_key || '',
        banner_show_women_only: existingConfig.banner_show_women_only !== false,
        payment_processor: existingConfig.payment_processor || 'stripe',
        stripe_publishable_key: existingConfig.stripe_publishable_key || '',
        stripe_secret_key: existingConfig.stripe_secret_key || '',
        stripe_price_id: existingConfig.stripe_price_id || '',
        paymentnerds_api_key: existingConfig.paymentnerds_api_key || '',
        paymentnerds_merchant_id: existingConfig.paymentnerds_merchant_id || '',
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
          <CardTitle className="font-heading text-lg">Payment Processor</CardTitle>
          <CardDescription>Configure which payment processor handles subscriptions. Switch to PaymentNerds if your Stripe account is terminated, then run migration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Processor</Label>
            <Select value={form.payment_processor} onValueChange={v => updateField('payment_processor', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paymentnerds">PaymentNerds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stripe Keys */}
          <div className="space-y-3 border rounded-lg p-4">
            <p className="text-sm font-medium">Stripe Configuration</p>
            <div className="space-y-2">
              <Label>Publishable Key (pk_live_...)</Label>
              <Input value={form.stripe_publishable_key} onChange={e => updateField('stripe_publishable_key', e.target.value)} placeholder="pk_live_..." />
            </div>
            <div className="space-y-2">
              <Label>Secret Key (sk_live_...)</Label>
              <Input value={form.stripe_secret_key} onChange={e => updateField('stripe_secret_key', e.target.value)} placeholder="sk_live_..." type="password" />
              <p className="text-xs text-muted-foreground">Stored securely, only used server-side.</p>
            </div>
            <div className="space-y-2">
              <Label>Price ID (price_...)</Label>
              <Input value={form.stripe_price_id} onChange={e => updateField('stripe_price_id', e.target.value)} placeholder="price_..." />
              <p className="text-xs text-muted-foreground">Create a recurring monthly price in your Stripe dashboard and paste the ID here.</p>
            </div>
          </div>

          {/* PaymentNerds Keys */}
          <div className="space-y-3 border rounded-lg p-4">
            <p className="text-sm font-medium">PaymentNerds Configuration</p>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input value={form.paymentnerds_api_key} onChange={e => updateField('paymentnerds_api_key', e.target.value)} placeholder="pn_live_..." type="password" />
            </div>
            <div className="space-y-2">
              <Label>Merchant ID</Label>
              <Input value={form.paymentnerds_merchant_id} onChange={e => updateField('paymentnerds_merchant_id', e.target.value)} placeholder="Your PaymentNerds Merchant ID" />
            </div>
          </div>

          {/* Migration Tool */}
          <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/5 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Subscription Migration</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save settings first, then click below to cancel all active subscriptions on the <strong>previous</strong> processor and flag users to re-subscribe on the new one.
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
                const res = await base44.functions.invoke('migrateSubscriptions', {});
                setMigrateResult(res.data?.message || 'Migration complete.');
                setMigrating(false);
              }}
            >
              {migrating ? 'Migrating…' : 'Run Subscription Migration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full gap-2 rounded-full" size="lg" onClick={handleSave} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}