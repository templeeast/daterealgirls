import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Send, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useMyProfile from '@/hooks/useMyProfile';
import { useTranslation } from 'react-i18next';

const CATEGORY_KEYS = [
  { value: 'account_access', key: 'cat_account_access' },
  { value: 'payment_billing', key: 'cat_payment_billing' },
  { value: 'verification', key: 'cat_verification' },
  { value: 'technical', key: 'cat_technical' },
  { value: 'harassment_abuse', key: 'cat_harassment' },
  { value: 'general', key: 'cat_general' },
];

const statusColors = {
  open: 'bg-accent text-accent-foreground',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

export default function Support() {
  const { user } = useMyProfile();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', description: '', email: '' });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['myTickets', user?.id],
    queryFn: () => user ? base44.entities.SupportTicket.filter({ user_id: user.id }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({
      category: data.category,
      subject: data.subject,
      description: data.description,
      user_id: user?.id || 'guest',
      user_email: user?.email || data.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setShowForm(false);
      setForm({ category: '', subject: '', description: '', email: '' });
      toast({ title: t('ticket_submitted') });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">{t('support_title')}</h1>
        <Button className="gap-2 rounded-full" onClick={() => setShowForm(!showForm)}>
          <HelpCircle className="w-4 h-4" />
          {t('new_ticket_btn')}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-lg">{t('submit_ticket_title')}</CardTitle>
            <CardDescription>{t('submit_ticket_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('category_label')}</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder={t('select_category')} /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_KEYS.map(c => <SelectItem key={c.value} value={c.value}>{t(c.key)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!user && (
              <div className="space-y-2">
                <Label>Your Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t('subject_label')}</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder={t('subject_placeholder')} />
            </div>
            <div className="space-y-2">
              <Label>{t('description_label')}</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder={t('description_placeholder')} className="h-32" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('cancel_btn')}</Button>
              <Button
                className="gap-2"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.category || !form.subject || !form.description || (!user && !form.email)}
              >
                <Send className="w-4 h-4" /> {t('submit_btn')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Tickets */}
      <div className="space-y-3">
        {tickets.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('no_tickets')}</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <Card key={ticket.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t(CATEGORY_KEYS.find(c => c.value === ticket.category)?.key || '')}
                    </p>
                  </div>
                  <Badge className={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
                {ticket.admin_response && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('admin_response_label')}</p>
                    <p className="text-sm">{ticket.admin_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}