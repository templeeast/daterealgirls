import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { HelpCircle, MessageCircle } from 'lucide-react';

const categoryLabels = {
  account_access: 'Account Access',
  payment_billing: 'Payment & Billing',
  verification: 'Verification',
  technical: 'Technical',
  harassment_abuse: 'Harassment/Abuse',
  general: 'General',
};

const statusColors = {
  open: 'bg-accent text-accent-foreground',
  in_progress: 'bg-primary/10 text-primary',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

export default function TicketsPanel() {
  const queryClient = useQueryClient();
  const [replyDialog, setReplyDialog] = useState(null);
  const [reply, setReply] = useState('');

  const { data: tickets } = useQuery({
    queryKey: ['allTicketsAdmin'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date', 50),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTicketsAdmin'] });
      setReplyDialog(null);
      setReply('');
    },
  });

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <HelpCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No tickets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(t => (
        <Card key={t.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium">{t.subject}</h3>
                  <Badge className={statusColors[t.status] + ' text-xs'}>{t.status.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className="text-xs">{categoryLabels[t.category]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{t.user_email}</p>
                <p className="text-sm mt-2">{t.description}</p>
                {t.admin_response && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Response</p>
                    <p className="text-sm">{t.admin_response}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Select
                  value={t.status}
                  onValueChange={v => updateMutation.mutate({ id: t.id, data: { status: v } })}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setReplyDialog(t)}>
                  <MessageCircle className="w-3 h-3" /> Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!replyDialog} onOpenChange={() => setReplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to: {replyDialog?.subject}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Type your response..."
            value={reply}
            onChange={e => setReply(e.target.value)}
            className="h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({
              id: replyDialog.id,
              data: { admin_response: reply, status: 'in_progress' }
            })}>
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}