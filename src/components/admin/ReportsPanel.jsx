import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

export default function ReportsPanel() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserReport.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allReports'] }),
  });

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
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}