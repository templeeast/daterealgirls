import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Pencil, Trash2, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const emptyForm = { code: '', description: '', tokens: '', type: 'purchase', is_active: true, max_uses: '', expires_at: '' };

export default function PromoCodes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: () => base44.entities.PromoCode.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        code: data.code.trim().toUpperCase(),
        tokens: Number(data.tokens),
        max_uses: data.max_uses ? Number(data.max_uses) : null,
        expires_at: data.expires_at || null,
      };
      if (editing) {
        return base44.entities.PromoCode.update(editing.id, payload);
      }
      return base44.entities.PromoCode.create({ ...payload, times_used: 0 });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promo-codes'] });
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PromoCode.update(id, { is_active: !is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promo-codes'] }),
  });

  const handleEdit = (code) => {
    setEditing(code);
    setForm({
      code: code.code,
      description: code.description || '',
      tokens: String(code.tokens),
      type: code.type,
      is_active: code.is_active,
      max_uses: code.max_uses ? String(code.max_uses) : '',
      expires_at: code.expires_at || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
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
          <Tag className="w-6 h-6 text-primary" />
          Promo Codes
        </h1>
        <div className="ml-auto">
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Code
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">{editing ? 'Edit Promo Code' : 'Create Promo Code'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Code *</label>
                <Input
                  placeholder="e.g. SUMMER25"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bonus Tokens *</label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={form.tokens}
                  onChange={e => setForm(f => ({ ...f, tokens: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  placeholder="e.g. 1,000 bonus tokens for new users"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type *</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
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
                  value={form.max_uses}
                  onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Expires On (optional)</label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.code || !form.tokens}
              >
                {saveMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No promo codes yet. Create one to get started.</p>
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
                      onClick={() => toggleMutation.mutate({ id: code.id, is_active: code.is_active })}
                    >
                      {code.is_active ? <XCircle className="w-4 h-4 text-muted-foreground" /> : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(code)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { if (confirm(`Delete promo code ${code.code}?`)) deleteMutation.mutate(code.id); }}
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
    </div>
  );
}