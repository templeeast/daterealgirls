import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function TokenEconomySettings({ form, updateField }) {
  const toggle = (field, v) => updateField(field, v);
  const num = (field, v) => updateField(field, v === '' ? '' : Number(v));

  return (
    <div className="space-y-6">
      {/* First Purchase Bonus */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">First Purchase Bonus</CardTitle>
          <CardDescription>Bonus tokens granted automatically on a user's very first token purchase. Configurable per gender.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Men */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable First Purchase Bonus — Men</p>
              <p className="text-xs text-muted-foreground">When ON, men receive bonus tokens on their first token purchase.</p>
            </div>
            <Switch checked={form.first_purchase_bonus_men_enabled !== false} onCheckedChange={v => toggle('first_purchase_bonus_men_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bonus Tokens — Men</Label>
              <Input type="number" value={form.first_purchase_bonus_men_tokens ?? 5000} onChange={e => num('first_purchase_bonus_men_tokens', e.target.value)} disabled={form.first_purchase_bonus_men_enabled === false} />
            </div>
          </div>
          {/* Women */}
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Enable First Purchase Bonus — Women</p>
              <p className="text-xs text-muted-foreground">When ON, women receive bonus tokens on their first token purchase.</p>
            </div>
            <Switch checked={form.first_purchase_bonus_women_enabled === true} onCheckedChange={v => toggle('first_purchase_bonus_women_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bonus Tokens — Women</Label>
              <Input type="number" value={form.first_purchase_bonus_women_tokens ?? 0} onChange={e => num('first_purchase_bonus_women_tokens', e.target.value)} disabled={!form.first_purchase_bonus_women_enabled} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Browsing Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Profile Browsing</CardTitle>
          <CardDescription>Token costs for browsing profiles beyond the free weekly limit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Free Browse Limit (profiles/week)</Label>
              <Input type="number" value={form.tokens_free_browse_limit ?? 25} onChange={e => num('tokens_free_browse_limit', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Require Tokens for Browsing — Men</p>
              <p className="text-xs text-muted-foreground">When ON, men pay tokens after {form.tokens_free_browse_limit ?? 25} profiles per week.</p>
            </div>
            <Switch checked={form.tokens_browse_men_enabled !== false} onCheckedChange={v => toggle('tokens_browse_men_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost — Men (per profile beyond limit)</Label>
              <Input type="number" value={form.tokens_browse_cost_men ?? 100} onChange={e => num('tokens_browse_cost_men', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Require Tokens for Browsing — Women</p>
              <p className="text-xs text-muted-foreground">When ON, women pay tokens after the free limit.</p>
            </div>
            <Switch checked={form.tokens_browse_women_enabled || false} onCheckedChange={v => toggle('tokens_browse_women_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost — Women (per profile beyond limit)</Label>
              <Input type="number" value={form.tokens_browse_cost_women ?? 0} onChange={e => num('tokens_browse_cost_women', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Messaging</CardTitle>
          <CardDescription>Token cost per message sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Require Tokens for Messaging — Men</p>
            </div>
            <Switch checked={form.tokens_msg_men_enabled !== false} onCheckedChange={v => toggle('tokens_msg_men_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost per Message — Men</Label>
              <Input type="number" value={form.tokens_msg_cost_men ?? 50} onChange={e => num('tokens_msg_cost_men', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Require Tokens for Messaging — Women</p>
            </div>
            <Switch checked={form.tokens_msg_women_enabled || false} onCheckedChange={v => toggle('tokens_msg_women_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost per Message — Women</Label>
              <Input type="number" value={form.tokens_msg_cost_women ?? 0} onChange={e => num('tokens_msg_cost_women', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Verification Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">ID Verification</CardTitle>
          <CardDescription>Token cost for ID verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Require Tokens for Verification — Men</p>
            </div>
            <Switch checked={form.tokens_verify_men_enabled !== false} onCheckedChange={v => toggle('tokens_verify_men_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost for Verification — Men</Label>
              <Input type="number" value={form.tokens_verify_cost_men ?? 200} onChange={e => num('tokens_verify_cost_men', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Require Tokens for Verification — Women</p>
            </div>
            <Switch checked={form.tokens_verify_women_enabled !== false} onCheckedChange={v => toggle('tokens_verify_women_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Token Cost for Verification — Women</Label>
              <Input type="number" value={form.tokens_verify_cost_women ?? 200} onChange={e => num('tokens_verify_cost_women', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Payment Links */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Stripe Payment Links in Chat</CardTitle>
          <CardDescription>Allow ID-verified members to embed a Stripe payment link in chat messages. Set the token cost per message that includes a payment link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable for Men</p>
              <p className="text-xs text-muted-foreground">Allow verified male members to embed payment links in messages.</p>
            </div>
            <Switch checked={form.stripe_payment_link_enabled_men || false} onCheckedChange={v => toggle('stripe_payment_link_enabled_men', v)} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Enable for Women</p>
              <p className="text-xs text-muted-foreground">Allow verified female members to embed payment links in messages.</p>
            </div>
            <Switch checked={form.stripe_payment_link_enabled_women || false} onCheckedChange={v => toggle('stripe_payment_link_enabled_women', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Token Cost per Message with Payment Link</Label>
              <Input type="number" value={form.stripe_link_message_credit_cost ?? 5} onChange={e => num('stripe_link_message_credit_cost', e.target.value)} />
              <p className="text-xs text-muted-foreground">Deducted from the sender's balance each time they embed a payment link in a message.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Features */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Video Features</CardTitle>
          <CardDescription>Enable video uploads and configure token costs for private photos and chat messages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Videos for Private Photos — Men</p>
              <p className="text-xs text-muted-foreground">When ON, male members can upload short video clips as private photos.</p>
            </div>
            <Switch checked={form.videos_private_men_enabled || false} onCheckedChange={v => toggle('videos_private_men_enabled', v)} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Enable Videos for Private Photos — Women</p>
              <p className="text-xs text-muted-foreground">When ON, female members can upload short video clips as private photos.</p>
            </div>
            <Switch checked={form.videos_private_women_enabled || false} onCheckedChange={v => toggle('videos_private_women_enabled', v)} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Enable Videos for Chat — Men</p>
              <p className="text-xs text-muted-foreground">When ON, male members can send short video clips in chat messages.</p>
            </div>
            <Switch checked={form.videos_chat_men_enabled || false} onCheckedChange={v => toggle('videos_chat_men_enabled', v)} />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-medium text-sm">Enable Videos for Chat — Women</p>
              <p className="text-xs text-muted-foreground">When ON, female members can send short video clips in chat messages.</p>
            </div>
            <Switch checked={form.videos_chat_women_enabled || false} onCheckedChange={v => toggle('videos_chat_women_enabled', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Max Video Duration (seconds)</Label>
              <Input type="number" value={form.max_video_duration_seconds ?? 30} onChange={e => num('max_video_duration_seconds', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Video File Size (MB)</Label>
              <Input type="number" value={form.max_video_file_size_mb ?? 25} onChange={e => num('max_video_file_size_mb', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Token Cost — Send Photo in Message</Label>
              <Input type="number" value={form.tokens_msg_photo_cost ?? 5} onChange={e => num('tokens_msg_photo_cost', e.target.value)} />
              <p className="text-xs text-muted-foreground">Charged to male users per photo sent in chat.</p>
            </div>
            <div className="space-y-2">
              <Label>Token Cost — View Private Video</Label>
              <Input type="number" value={form.tokens_private_video_cost ?? 10} onChange={e => num('tokens_private_video_cost', e.target.value)} />
              <p className="text-xs text-muted-foreground">Charged to male viewers per private video unlock.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Token Cost — Send Video in Message (Men)</Label>
              <Input type="number" value={form.tokens_msg_video_cost_men ?? 10} onChange={e => num('tokens_msg_video_cost_men', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Token Cost — Send Video in Message (Women)</Label>
              <Input type="number" value={form.tokens_msg_video_cost_women ?? 10} onChange={e => num('tokens_msg_video_cost_women', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Token Packs</CardTitle>
          <CardDescription>Configure the 4 token purchase packs available to users.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-semibold text-sm">Starter Pack</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tokens</Label>
                  <Input type="number" value={form.token_pack_starter_tokens ?? 500} onChange={e => num('token_pack_starter_tokens', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" step="0.01" value={form.token_pack_starter_price ?? 5.99} onChange={e => num('token_pack_starter_price', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3 border-primary/30 bg-primary/5">
              <p className="font-semibold text-sm">Popular Pack <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Most Popular</span></p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tokens</Label>
                  <Input type="number" value={form.token_pack_popular_tokens ?? 1500} onChange={e => num('token_pack_popular_tokens', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" step="0.01" value={form.token_pack_popular_price ?? 14.99} onChange={e => num('token_pack_popular_price', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-semibold text-sm">Value Pack</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tokens</Label>
                  <Input type="number" value={form.token_pack_value_tokens ?? 3500} onChange={e => num('token_pack_value_tokens', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" step="0.01" value={form.token_pack_value_price ?? 29.99} onChange={e => num('token_pack_value_price', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <p className="font-semibold text-sm">Best Deal Pack <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Best Value</span></p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tokens</Label>
                  <Input type="number" value={form.token_pack_best_tokens ?? 8000} onChange={e => num('token_pack_best_tokens', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" step="0.01" value={form.token_pack_best_price ?? 59.99} onChange={e => num('token_pack_best_price', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}