import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronRight, Loader2, User } from 'lucide-react';
import VerificationDetail from './VerificationDetail';

export default function VerificationQueue({ profileId }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(profileId || null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: async () => {
      const [pending, rejected] = await Promise.all([
        base44.entities.MemberProfile.filter({ profile_review_status: 'pending' }),
        base44.entities.MemberProfile.filter({ profile_review_status: 'rejected' }),
      ]);
      // Deduplicate by id
      const seen = new Set();
      return [...pending, ...rejected].filter(p => seen.has(p.id) ? false : seen.add(p.id));
    },
    initialData: [],
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, reviewStatus, verificationStatus, rejectionReason, rejectionDetails }) =>
      base44.entities.MemberProfile.update(id, {
        profile_review_status: reviewStatus,
        verification_status: verificationStatus,
        ...(verificationStatus === 'rejected' && {
          is_suspended: true,
          suspension_reason: 'verification_rejected',
          verification_rejection_reason: rejectionReason || 'other',
          verification_rejection_details: rejectionDetails || '',
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setSelectedId(null);
    },
  });

  const handleVerify = (id, reviewStatus, verificationStatus, extra = {}) =>
    verifyMutation.mutate({ id, reviewStatus, verificationStatus, ...extra });

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
        onVerify={handleVerify}
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
            {p.gender_review_needed ? (
              <Badge className="bg-amber-100 text-amber-700 shrink-0 border-amber-300">⚠ Gender Review</Badge>
            ) : p.didit_verification_status === 'Approved' ? (
              <Badge className="bg-green-100 text-green-700 shrink-0">Verified by Didit</Badge>
            ) : p.didit_verification_status === 'Declined' ? (
              <Badge className="bg-red-100 text-red-700 shrink-0">Declined by Didit</Badge>
            ) : p.didit_verification_status === 'pending' ? (
              <Badge className="bg-amber-100 text-amber-700 shrink-0">Didit Pending</Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-700 shrink-0">Not Started</Badge>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}