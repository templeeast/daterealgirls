import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, User, ExternalLink, Loader2 } from 'lucide-react';

async function getSignedUrl(fileUri) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
  return signed_url;
}

export default function VerificationQueue() {
  const queryClient = useQueryClient();
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [selfieUrls, setSelfieUrls] = useState({});     // { [profileId]: { orig, updated } }

  const { data: pending, isLoading } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: () => base44.entities.MemberProfile.filter({ verification_status: 'pending' }),
    initialData: [],
  });

  // Generate signed URLs for all private selfie/id images
  useEffect(() => {
    pending.forEach(async (p) => {
      if (selfieUrls[p.id]) return; // already loaded
      const urls = {};
      if (p.selfie_url)       urls.selfie      = await getSignedUrl(p.selfie_url).catch(() => null);
      if (p.selfie_url_2)     urls.selfie2     = await getSignedUrl(p.selfie_url_2).catch(() => null);
      setSelfieUrls(prev => ({ ...prev, [p.id]: urls }));
    });
  }, [pending]);

  const openDoc = async (profileId, key, fileUri) => {
    const docKey = `${profileId}-${key}`;
    setLoadingDoc(docKey);
    const url = await getSignedUrl(fileUri).catch(() => null);
    setLoadingDoc(null);
    if (url) window.open(url, '_blank');
  };

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) =>
      base44.entities.MemberProfile.update(id, { verification_status: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
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

  return (
    <div className="space-y-6">
      {pending.map(p => {
        const urls = selfieUrls[p.id] || {};
        return (
          <Card key={p.id}>
            <CardContent className="pt-6 space-y-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-base">{p.display_name}, {p.age}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.email || ''}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="gap-1" onClick={() => verifyMutation.mutate({ id: p.id, status: 'verified' })}>
                    <CheckCircle className="w-4 h-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => verifyMutation.mutate({ id: p.id, status: 'rejected' })}>
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              </div>

              {/* Documents grid */}
              <div className="grid grid-cols-2 gap-4">

                {/* Original Selfie */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original Selfie</p>
                  {urls.selfie ? (
                    <img src={urls.selfie} className="w-full h-40 object-cover rounded-xl border" alt="Original selfie" />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Not uploaded</p>
                    </div>
                  )}
                </div>

                {/* Updated Selfie */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    Re-uploaded Selfie
                    {urls.selfie2 && <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">New</Badge>}
                  </p>
                  {urls.selfie2 ? (
                    <img src={urls.selfie2} className="w-full h-40 object-cover rounded-xl border border-amber-300" alt="Updated selfie" />
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-xs text-muted-foreground italic">No re-upload</p>
                    </div>
                  )}
                </div>

                {/* Original Govt ID */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original Govt. ID</p>
                  {p.id_document_url ? (
                    <button
                      onClick={() => openDoc(p.id, 'id1', p.id_document_url)}
                      disabled={loadingDoc === `${p.id}-id1`}
                      className="w-full h-40 rounded-xl border bg-muted flex flex-col items-center justify-center gap-2 hover:bg-muted/70 transition-colors disabled:opacity-50"
                    >
                      {loadingDoc === `${p.id}-id1`
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><ExternalLink className="w-5 h-5 text-primary" /><span className="text-xs text-primary font-medium">View Original ID</span></>
                      }
                    </button>
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Not submitted</p>
                    </div>
                  )}
                </div>

                {/* Updated Govt ID */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    Re-uploaded Govt. ID
                    {p.id_document_url_2 && <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">New</Badge>}
                  </p>
                  {p.id_document_url_2 ? (
                    <button
                      onClick={() => openDoc(p.id, 'id2', p.id_document_url_2)}
                      disabled={loadingDoc === `${p.id}-id2`}
                      className="w-full h-40 rounded-xl border border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-2 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      {loadingDoc === `${p.id}-id2`
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><ExternalLink className="w-5 h-5 text-amber-700" /><span className="text-xs text-amber-700 font-medium">View New ID</span></>
                      }
                    </button>
                  ) : (
                    <div className="w-full h-40 rounded-xl bg-muted flex items-center justify-center">
                      <p className="text-xs text-muted-foreground italic">No re-upload</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning if re-uploads exist */}
              {(p.selfie_url_2 || p.id_document_url_2) && (
                <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
                  ⚠ This member has re-uploaded one or more documents. Compare originals vs. new uploads to verify identity consistency.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}