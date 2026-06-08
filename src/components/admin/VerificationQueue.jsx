import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronRight, Loader2, User } from 'lucide-react';
import VerificationDetail from './VerificationDetail';

export default function VerificationQueue() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: () => base44.entities.MemberProfile.filter({ verification_status: 'pending' }),
    initialData: [],
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.MemberProfile.update(id, { verification_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setSelectedId(null);
    },
  });

  if (isLoading) return <div className="text-center py-16"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" /></div>;

  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No pending verifications.</p>
      </div>
    );
  }

  const selected = pending.find(p => p.id === selectedId);

  if (selected) {
    return (
      <VerificationDetail
        profile={selected}
        onBack={() => setSelectedId(null)}
        onVerify={(id, status) => verifyMutation.mutate({ id, status })}
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground mb-4">{pending.length} member{pending.length !== 1 ? 's' : ''} awaiting verification</p>
      {pending.map(p => (
        <Card
          key={p.id}
          className="cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
          onClick={() => setSelectedId(p.id)}
        >
          <CardContent className="py-4 flex items-center gap-4">
            {p.photo_1 ? (
              <img src={p.photo_1} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{p.display_name}, {p.age}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
            </div>
            {(p.selfie_url_2 || p.id_document_url_2 || p.id_document_back_url_2) && (
              <Badge className="bg-amber-100 text-amber-700 shrink-0">Re-uploaded</Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}