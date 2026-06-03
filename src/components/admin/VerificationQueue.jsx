import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, User, ExternalLink, Loader2 } from 'lucide-react';

export default function VerificationQueue() {
  const queryClient = useQueryClient();
  const [loadingIdFor, setLoadingIdFor] = useState(null);
  const [selfieUrls, setSelfieUrls] = useState({});

  const viewIdDocument = async (profileId, fileUri) => {
    setLoadingIdFor(profileId);
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    setLoadingIdFor(null);
    window.open(signed_url, '_blank');
  };

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: () => base44.entities.MemberProfile.filter({ verification_status: 'pending' }),
    initialData: [],
  });

  useEffect(() => {
    pending.forEach(async (p) => {
      if (p.selfie_url && !selfieUrls[p.id]) {
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: p.selfie_url });
        setSelfieUrls(prev => ({ ...prev, [p.id]: signed_url }));
      }
    });
  }, [pending]);

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.MemberProfile.update(id, { verification_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
    },
  });

  if (pending.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">No pending verifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending.map(p => (
        <Card key={p.id}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex gap-3">
                {p.photo_1 ? (
                  <img src={p.photo_1} className="w-16 h-16 rounded-xl object-cover" alt="" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                {p.selfie_url && selfieUrls[p.id] && (
                  <img src={selfieUrls[p.id]} className="w-16 h-16 rounded-xl object-cover" alt="Selfie" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{p.display_name}, {p.age}</h3>
                <p className="text-sm text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
                {p.id_document_url ? (
                  <button
                    onClick={() => viewIdDocument(p.id, p.id_document_url)}
                    disabled={loadingIdFor === p.id}
                    className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline disabled:opacity-50"
                  >
                    {loadingIdFor === p.id
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Loading...</>
                      : <><ExternalLink className="w-3 h-3" /> View Govt. ID Document</>
                    }
                  </button>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">No govt. ID submitted — selfie only</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => verifyMutation.mutate({ id: p.id, status: 'verified' })}
                >
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-destructive"
                  onClick={() => verifyMutation.mutate({ id: p.id, status: 'rejected' })}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}