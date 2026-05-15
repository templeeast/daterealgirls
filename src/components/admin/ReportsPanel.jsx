import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flag, CheckCircle } from 'lucide-react';

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

  const { data: reports } = useQuery({
    queryKey: ['allReports'],
    queryFn: () => base44.entities.UserReport.list('-created_date', 50),
    initialData: [],
  });

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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{reasonLabels[r.reason] || r.reason}</h3>
                  <Badge className={statusColors[r.status] + ' text-xs'}>{r.status}</Badge>
                </div>
                {r.reported_user_name && (
                  <p className="text-sm text-muted-foreground">Reported: {r.reported_user_name}</p>
                )}
                {r.details && <p className="text-sm mt-2">{r.details}</p>}
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