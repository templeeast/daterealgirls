import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Pencil, Trash2, Tag, Gift, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const emptyPromoForm = { code: '', description: '', tokens: '', type: 'purchase', is_active: true, visible: true, auto_award: false, max_uses: '', expires_at: '' };
const emptyBonusForm = { user_id: '', tokens: '', reason: '' };

export default function BonusesAndPromos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('promos');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoForm, setPromoForm] = useState(emptyPromoForm);
  const [bonusForm, setBonusForm] = useState(emptyBonusForm);
  const [awardingBonus, setAwardingBonus] = useState(false);
  const [awardToAll, setAwardToAll] = useState(false);

  const { data: codes = [], isLoading: codesLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => base44.entities.PromoCode.list('-created_date', 100),
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['member-profiles'],
    queryFn: () => base44.asServiceRole.entities.MemberProfile.list('-created_date', 500),
    enabled: activeTab === 'bonuses',
  });

  const savePromoMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        code: data.code.trim().toUpperCase(),
        tokens: Number(data.tokens),
        max_uses: data.max_uses ? Number(data.max_uses) : null,
        expires_at: data.expires_at || null,
      };
      if (editingPromo) {
        return base44.entities.PromoCode.update(editingPromo.id, payload);
      }
      return base44.entities.PromoCode.create({ ...payload, times_used: 0 });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-codes'] });
      setShowPromoForm(false);
      setEditingPromo(null);
      setPromoForm(emptyPromoForm);
      toast({ title: 'Promo code saved!' });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-codes'] });
      toast({ title: 'Promo code deleted.' });
    },
  });

  const togglePromoMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PromoCode.update(id, { is_active: !is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  });

  const awardBonusMutation = useMutation({
    mutationFn: async (data) => {
      const tokensToAdd = Number(data.tokens);
      const reason = data.reason.trim();

      if (!tokensToAdd || !reason) {
        throw new Error('Tokens and reason required');
      }

      if (awardToAll) {
        if (!profiles || profiles.length === 0) throw new Error('No members to award');
        await Promise.all(
          profiles.map(async (profile) => {
            const currentTokens = profile.tokens || 0;
            await base44.asServiceRole.entities.MemberProfile.update(profile.id, {
              tokens: currentTokens + tokensToAdd,
            });
            await base44.asServiceRole.entities.TokenTransaction.create({
              user_id: profile.user_id,
              type: 'bonus',
              tokens: tokensToAdd,
              description: reason,
            });
          })
        );
      } else {
        const profileId = data.user_id;
        if (!profileId) throw new Error('Member selection required');

        const profile = profiles.find(p => p.id === profileId);
        if (!profile) throw new Error('Profile not found');

        const currentTokens = profile.tokens || 0;
        await base44.asServiceRole.entities.MemberProfile.update(profileId, {
          tokens: currentTokens + tokensToAdd,
        });

        await base44.asServiceRole.entities.TokenTransaction.create({
          user_id: profile.user_id,
          type: 'bonus',
          tokens: tokensToAdd,
          description: reason,
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['member-profiles'] });
      setBonusForm(emptyBonusForm);
      setAwardToAll(false);
      setAwardingBonus(false);
      toast({ title: `Bonus awarded to ${awardToAll ? 'all members' : 'member'} successfully!` });
    },
    onError: (err) => {
      toast({ title: err.message || 'Failed to award bonus', variant: 'destructive' });
    },
  });

  const handleEditPromo = (code) => {
    setEditingPromo(code);
    setPromoForm({
      code: code.code,
      description: code.description || '',
      tokens: String(code.tokens),
      type: code.type,
      is_active: code.is_active,
      visible: code.visible !== false,
      auto_award: code.auto_award === true,
      max_uses: code.max_uses ? String(code.max_uses) : '',
      expires_at: code.expires_at || '',
    });
    setShowPromoForm(true);
  };

  const handleCancelPromo = () => {
    setShowPromoForm(false);
    setEditingPromo(null);
    setPromoForm(emptyPromoForm);
  };

  if (user?.role !== 'admin') {
    navigate('/');
    return null;
  }

  const typeLabel = { purchase: 'Purchase', verification: 'Verification', any: 'Any' };
  const typeBadgeClass = { purchase: 'bg-blue-100 text-blue-700', verification: 'bg-purple-100 text-purple-700', any: 'bg-green-100 text-green-700' };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          Bonuses & Promo Codes
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('promos')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'promos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4 inline mr-2" />
          Promo Codes
        </button>
        <button
          onClick={() => setActiveTab('bonuses')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'bonuses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Gift className="w-4 h-4 inline mr-2" />
          Award Bonuses
        </button>
      </div>

      {/* Promo Codes Tab */}
      {activeTab === 'promos' && (
        <>
          <div className="mb-6 flex justify-end">
            <Button onClick={() => { setShowPromoForm(true); setEditingPromo(null); setPromoForm(emptyPromoForm); }} className="gap-2">
              <Plus className="w-4 h-4" /> New Promo Code
            </Button>
          </div>

          {showPromoForm && (
            <Card className="mb-6 border-primary/30">
              <CardHeader>
                <CardTitle className="text-base">{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Code *</label>
                    <Input
                      placeholder="e.g. SUMMER25"
                      value={promoForm.code}
                      onChange={e => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Bonus Tokens *</label>
                    <Input
                      type="number"
                      placeholder="e.g. 1000"
                      value={promoForm.tokens}
                      onChange={e => setPromoForm(f => ({ ...f, tokens: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Input
                      placeholder="e.g. 1,000 bonus tokens for new users"
                      value={promoForm.description}
                      onChange={e => setPromoForm(f => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type *</label>
                    <Select value={promoForm.type} onValueChange={v => setPromoForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase — applies at token checkout</SelectItem>
                        <SelectItem value="verification">Verification — requires verified ID</SelectItem>
                        <SelectItem value="any">Any — usable in either place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Uses (blank = unlimited)</label>
                    <Input
                      type="number"
                      placeholder="Leave blank for unlimited"
                      value={promoForm.max_uses}
                      onChange={e => setPromoForm(f => ({ ...f, max_uses: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Expires On (optional)</label>
                    <Input
                      type="date"
                      value={promoForm.expires_at}
                      onChange={e => setPromoForm(f => ({ ...f, expires_at: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={promoForm.is_active}
                      onChange={e => setPromoForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium">Active</label>
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={promoForm.visible}
                      onChange={e => setPromoForm(f => ({ ...f, visible: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <label htmlFor="visible" className="text-sm font-medium">Visible on profile</label>
                      <p className="text-xs text-muted-foreground">Uncheck for targeted (code-only) promos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-5">
                    <input
                      type="checkbox"
                      id="auto_award"
                      checked={promoForm.auto_award}
                      onChange={e => setPromoForm(f => ({ ...f, auto_award: e.target.checked }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <label htmlFor="auto_award" className="text-sm font-medium">Automatic award</label>
                      <p className="text-xs text-muted-foreground">Awarded automatically by the system (e.g. profile completion) — hidden from manual "use this code" suggestions</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button
                    onClick={() => savePromoMutation.mutate(promoForm)}
                    disabled={savePromoMutation.isPending || !promoForm.code || !promoForm.tokens}
                  >
                    {savePromoMutation.isPending ? 'Saving...' : editingPromo ? 'Update' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelPromo}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {codesLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : codes.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No promo codes yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {codes.map(code => (
                <Card key={code.id} className={code.is_active ? '' : 'opacity-60'}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-lg tracking-wider">{code.code}</span>
                          <Badge className={typeBadgeClass[code.type]}>{typeLabel[code.type]}</Badge>
                          {code.is_active
                            ? <Badge className="bg-green-100 text-green-700">Active</Badge>
                            : <Badge variant="outline">Inactive</Badge>}
                          {code.visible === false
                            ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Hidden</Badge>
                            : null}
                          {code.auto_award === true
                            ? <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Auto-Award</Badge>
                            : null}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{code.description || '—'}</p>
                        <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-primary">+{(code.tokens || 0).toLocaleString()} tokens</span>
                          <span>Used: {code.times_used || 0}{code.max_uses ? ` / ${code.max_uses}` : ''}</span>
                          {code.expires_at && <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          title={code.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => togglePromoMutation.mutate({ id: code.id, is_active: code.is_active })}
                        >
                          {code.is_active ? <XCircle className="w-4 h-4 text-muted-foreground" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEditPromo(code)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { if (confirm(`Delete promo code ${code.code}?`)) deletePromoMutation.mutate(code.id); }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Award Bonuses Tab */}
      {activeTab === 'bonuses' && (
        <>
          <Card className="mb-6 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Award Bonus Tokens
              </CardTitle>
              <CardDescription>Manually award bonus tokens to a member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="award_all"
                  checked={awardToAll}
                  onChange={e => {
                    setAwardToAll(e.target.checked);
                    if (e.target.checked) setBonusForm(f => ({ ...f, user_id: '' }));
                  }}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="award_all" className="text-sm font-medium cursor-pointer flex-1">Award to all members</label>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Select Member {!awardToAll && '*'}</label>
                <Select value={bonusForm.user_id} onValueChange={v => setBonusForm(f => ({ ...f, user_id: v }))} disabled={awardToAll}>
                  <SelectTrigger><SelectValue placeholder={profilesLoading ? 'Loading members...' : awardToAll ? 'Awarding to all' : 'Select a member...'} /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.display_name} ({p.user_id?.slice(0, 8)}) — {(p.tokens || 0).toLocaleString()} tokens
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bonus Tokens *</label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={bonusForm.tokens}
                  onChange={e => setBonusForm(f => ({ ...f, tokens: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Reason *</label>
                <Textarea
                  placeholder="e.g. First purchase bonus, Customer appreciation, etc."
                  value={bonusForm.reason}
                  onChange={e => setBonusForm(f => ({ ...f, reason: e.target.value }))}
                  className="h-24"
                />
              </div>
              <Button
                onClick={() => awardBonusMutation.mutate(bonusForm)}
                disabled={awardBonusMutation.isPending || (!awardToAll && !bonusForm.user_id) || !bonusForm.tokens || !bonusForm.reason.trim()}
                className="w-full gap-2"
              >
                {awardBonusMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Awarding...</>
                ) : (
                  <><Gift className="w-4 h-4" /> Award Bonus {awardToAll && `to All (${profiles?.length || 0})`}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}