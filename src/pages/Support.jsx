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

const CATEGORIES = [
  { value: 'account_access', label: 'Account Access' },
  { value: 'payment_billing', label: 'Payment & Billing' },
  { value: 'verification', label: 'Profile Verification' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'harassment_abuse', label: 'Report Harassment/Abuse' },
  { value: 'general', label: 'General Inquiry' },
];

const statusColors = {
  open: 'bg-accent text-accent-foreground',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

export default function Support() {
  const { user } = useMyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', subject: '', description: '' });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['myTickets', user?.id],
    queryFn: () => user ? base44.entities.SupportTicket.filter({ user_id: user.id }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({
      ...data,
      user_id: user.id,
      user_email: user.email,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setShowForm(false);
      setForm({ category: '', subject: '', description: '' });
      toast({ title: 'Support ticket submitted' });
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-bold">Support</h1>
        <Button className="gap-2 rounded-full" onClick={() => setShowForm(!showForm)}>
          <HelpCircle className="w-4 h-4" />
          New Ticket
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Submit a Ticket</CardTitle>
            <CardDescription>We'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief summary" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your issue in detail..." className="h-32" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                className="gap-2"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.category || !form.subject || !form.description}
              >
                <Send className="w-4 h-4" /> Submit
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
            <p className="text-muted-foreground">No support tickets yet.</p>
          </div>
        ) : (
          tickets.map(ticket => (
            <Card key={ticket.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORIES.find(c => c.value === ticket.category)?.label}
                    </p>
                  </div>
                  <Badge className={statusColors[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{ticket.description}</p>
                {ticket.admin_response && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response</p>
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