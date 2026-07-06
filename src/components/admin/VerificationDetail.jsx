import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

function DiditStatusBadge({ profile: p }) {
  if (!p.didit_session_id) {
    return <Badge variant="secondary" className="text-xs">Didit Not Started</Badge>;
  }
  const s = p.didit_verification_status;
  if (s === 'Approved') return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">✅ Auto-Verified by Didit</Badge>;
  if (s === 'Declined') return <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">❌ Declined by Didit</Badge>;
  if (s === 'pending')  return <Badge variant="secondary" className="text-xs">⏳ Didit Pending</Badge>;
  return <Badge variant="secondary" className="text-xs">⏳ Didit Pending</Badge>;
}

function ImageCol({ label, url }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {url ? (
        <img src={url} className="w-full rounded-xl border object-contain bg-muted" style={{ maxHeight: 300 }} alt={label} />
      ) : (
        <div className="w-full rounded-xl bg-muted flex items-center justify-center" style={{ height: 200 }}>
          <p className="text-xs text-muted-foreground">Image not available</p>
        </div>
      )}
    </div>
  );
}

export default function VerificationDetail({ profile: p, onBack, onVerify }) {
  const [diditImages, setDiditImages]   = useState(null);
  const [diditLoading, setDiditLoading] = useState(false);
  const [diditError, setDiditError]     = useState(null);

  useEffect(() => {
    if (!p.didit_session_id) return;
    setDiditLoading(true);
    setDiditImages(null);
    setDiditError(null);
    base44.functions.invoke('fetchDiditSession', { sessionId: p.didit_session_id })
      .then(res  => setDiditImages(res.data ?? res))
      .catch(err => setDiditError(err.message))
      .finally(() => setDiditLoading(false));
  }, [p.didit_session_id]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-1 -ml-1" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" /> Back to list
      </Button>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-medium text-base">{p.display_name}, {p.age}</h3>
              <p className="text-sm text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
              <DiditStatusBadge profile={p} />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="gap-1" onClick={() => onVerify(p.id, 'approved', 'verified')}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => onVerify(p.id, 'rejected', 'rejected')}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </div>

          {/* Didit Images */}
          {!p.didit_session_id ? (
            <div className="w-full rounded-xl bg-muted flex items-center justify-center py-10">
              <p className="text-sm text-muted-foreground">No Didit session on file for this member.</p>
            </div>
          ) : diditLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : diditError ? (
            <div className="rounded-xl bg-destructive/10 text-destructive text-sm p-4">
              Could not load Didit images: {diditError}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <ImageCol label="Member Selfie"   url={diditImages?.selfie_image} />
              <ImageCol label="Govt ID — Front" url={diditImages?.id_front_image} />
              <ImageCol label="Govt ID — Back"  url={diditImages?.id_back_image} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}