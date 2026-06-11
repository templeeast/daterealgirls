import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, ExternalLink, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const reasonLabels = {
  fake_profile: 'Fake Profile',
  harassment: 'Harassment',
  inappropriate_content: 'Inappropriate Content',
  underage: 'Suspected Underage',
  spam: 'Spam',
  other: 'Other',
};

const statusColors = {
  pending: 'bg-accent text-accent-foreground',
  reviewing: 'bg-primary/10 text-primary',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-muted text-muted-foreground',
};

const actionLabels = {
  warning: 'Warning',
  suspension: 'Suspension',
  ban: 'Ban',
};

const defaultMessages = {
  warning: "Your account has received a warning due to a report about your behavior on the platform. Please review our community guidelines. Further violations may result in suspension.",
  suspension: "Your account has been temporarily suspended following a report about your behavior. Please contact support if you believe this is an error.",
  ban: "Your account has been permanently banned for violating our community guidelines.",
};

export default function ReportsPanel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messageDialog, setMessageDialog] = useState(null); // { report, userEmail, userName }
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const { data: reports } = useQuery({
    queryKey: ['allReports'],
    queryFn: () => base44.entities.UserReport.list('-created_date', 50),
    initialData: [],
  });

  // Build a map of user_id -> profile for reporters
  const { data: profiles } = useQuery({
    queryKey: ['allProfilesForReports'],
    queryFn: () => base44.entities.MemberProfile.list(),
    initialData: [],
  });
  const profileByUserId = useMemo(() => {
    const map = {};
    profiles.forEach(p => { map[p.user_id] = p; });
    return map;
  }, [profiles]);

  const { data: users } = useQuery({
    queryKey: ['allUsersForReports'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });
  const userById = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.id] = u; });
    return map;
  }, [users]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allReports'] }),
  });

  const openMessageDialog = (r) => {
    const reportedProfile = profiles.find(p => p.id === r.reported_profile_id);
    const reportedUser = reportedProfile ? userById[reportedProfile.user_id] : null;
    const action = r.action_taken && r.action_taken !== 'none' ? r.action_taken : 'warning';
    setMessageText(defaultMessages[action] || '');
    setMessageDialog({
      report: r,
      userEmail: reportedUser?.email || '',
      userName: r.reported_user_name || reportedProfile?.display_name || 'User',
    });
  };

  const handleSendMessage = async () => {
    if (!messageDialog?.userEmail) {
      toast({ title: "No email found for this user.", variant: 'destructive' });
      return;
    }
    setSendingMessage(true);
    await base44.integrations.Core.SendEmail({
      to: messageDialog.userEmail,
      subject: `Important notice about your account`,
      body: messageText,
    });
    setSendingMessage(false);
    setMessageDialog(null);
    toast({ title: `Message sent to ${messageDialog.userName}.` });
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <Flag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map(r => (
        <Card key={r.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{reasonLabels[r.reason] || r.reason}</h3>
                  <Badge className={statusColors[r.status] + ' text-xs'}>{r.status}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{r.created_date ? new Date(r.created_date).toLocaleDateString() : ''}</span>
                </div>
                <div className="flex flex-col gap-1 text-sm mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground w-20 shrink-0">Reporter:</span>
                    {(() => {
                      const rp = profileByUserId[r.reporter_id];
                      return rp ? (
                        <button onClick={() => navigate(`/profile/${rp.id}`)} className="text-primary hover:underline flex items-center gap-1">
                          {rp.display_name} <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-muted-foreground italic">{r.reporter_id ? `User ${r.reporter_id.slice(0,8)}…` : 'Unknown'}</span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground w-20 shrink-0">Flagging:</span>
                    {r.reported_profile_id ? (
                      <button onClick={() => navigate(`/profile/${r.reported_profile_id}`)} className="text-destructive hover:underline flex items-center gap-1 font-medium">
                        {r.reported_user_name || 'View Profile'} <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-muted-foreground italic">Unknown</span>
                    )}
                  </div>
                </div>
                {r.details && <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2 mt-1">{r.details}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                <Select
                  value={r.status}
                  onValueChange={v => updateMutation.mutate({ id: r.id, data: { status: v } })}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={r.action_taken || 'none'}
                  onValueChange={v => updateMutation.mutate({ id: r.id, data: { action_taken: v } })}
                >
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Action</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                  </SelectContent>
                </Select>
                {r.action_taken && r.action_taken !== 'none' && (
                  <Button size="sm" variant="outline" className="w-32 gap-1.5" onClick={() => openMessageDialog(r)}>
                    <Mail className="w-3.5 h-3.5" />
                    Notify User
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Dialog open={!!messageDialog} onOpenChange={open => !open && setMessageDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notify User: {messageDialog?.userName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {messageDialog?.userEmail ? (
              <p className="text-sm text-muted-foreground">Sending to: <span className="font-medium text-foreground">{messageDialog.userEmail}</span></p>
            ) : (
              <p className="text-sm text-destructive">No email address found for this user.</p>
            )}
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                className="h-36"
                placeholder="Enter your message to the user..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog(null)}>Cancel</Button>
            <Button onClick={handleSendMessage} disabled={sendingMessage || !messageText.trim()} className="gap-2">
              <Mail className="w-4 h-4" />
              {sendingMessage ? 'Sending…' : 'Send Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}