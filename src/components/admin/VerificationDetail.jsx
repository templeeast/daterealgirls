import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';

async function getSignedUrl(fileUri) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
  return signed_url;
}

export default function VerificationDetail({ profile: p, onBack, onVerify }) {
  const [loadingDoc, setLoadingDoc] = useState(null);
  const [urls, setUrls] = useState({});

  useEffect(() => {
    const load = async () => {
      const loaded = {};
      if (p.selfie_url)            loaded.selfie   = await getSignedUrl(p.selfie_url).catch(() => null);
      if (p.selfie_url_2)          loaded.selfie2  = await getSignedUrl(p.selfie_url_2).catch(() => null);
      setUrls(loaded);
    };
    load();
  }, [p.id]);

  const openDoc = async (key, fileUri) => {
    setLoadingDoc(key);
    const url = await getSignedUrl(fileUri).catch(() => null);
    setLoadingDoc(null);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="gap-1 -ml-1" onClick={onBack}>
        <ArrowLeft className="w-4 h-4" /> Back to list
      </Button>

      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-base">{p.display_name}, {p.age}</h3>
              <p className="text-sm text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="gap-1" onClick={() => onVerify(p.id, 'verified')}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => onVerify(p.id, 'rejected')}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </div>

          {/* Selfies */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original Selfie</p>
              {urls.selfie ? (
                <img src={urls.selfie} className="w-full h-48 object-cover rounded-xl border" alt="Original selfie" />
              ) : (
                <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Not uploaded</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                Re-uploaded Selfie
                {urls.selfie2 && <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">New</Badge>}
              </p>
              {urls.selfie2 ? (
                <img src={urls.selfie2} className="w-full h-48 object-cover rounded-xl border border-amber-300" alt="Updated selfie" />
              ) : (
                <div className="w-full h-48 rounded-xl bg-muted flex items-center justify-center">
                  <p className="text-xs text-muted-foreground italic">No re-upload</p>
                </div>
              )}
            </div>
          </div>

          {/* Original Govt. ID */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Original Govt. ID</p>
            <div className="grid grid-cols-2 gap-4">
              {['id_document_url', 'id_document_back_url'].map((field, i) => {
                const key = i === 0 ? 'id1' : 'idb1';
                const label = i === 0 ? 'Front' : 'Back';
                return (
                  <div key={field} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {p[field] ? (
                      <button onClick={() => openDoc(key, p[field])} disabled={loadingDoc === key}
                        className="w-full h-36 rounded-xl border bg-muted flex flex-col items-center justify-center gap-2 hover:bg-muted/70 transition-colors disabled:opacity-50">
                        {loadingDoc === key ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ExternalLink className="w-5 h-5 text-primary" /><span className="text-xs text-primary font-medium">View {label}</span></>}
                      </button>
                    ) : (
                      <div className="w-full h-36 rounded-xl bg-muted flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">Not submitted</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Re-uploaded Govt. ID */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
              Re-uploaded Govt. ID
              {(p.id_document_url_2 || p.id_document_back_url_2) && <Badge className="bg-amber-100 text-amber-700 text-xs ml-1">New</Badge>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {['id_document_url_2', 'id_document_back_url_2'].map((field, i) => {
                const key = i === 0 ? 'id2' : 'idb2';
                const label = i === 0 ? 'Front' : 'Back';
                return (
                  <div key={field} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {p[field] ? (
                      <button onClick={() => openDoc(key, p[field])} disabled={loadingDoc === key}
                        className="w-full h-36 rounded-xl border border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-2 hover:bg-amber-100 transition-colors disabled:opacity-50">
                        {loadingDoc === key ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ExternalLink className="w-5 h-5 text-amber-700" /><span className="text-xs text-amber-700 font-medium">View New {label}</span></>}
                      </button>
                    ) : (
                      <div className="w-full h-36 rounded-xl bg-muted flex items-center justify-center">
                        <p className="text-xs text-muted-foreground italic">No re-upload</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(p.selfie_url_2 || p.id_document_url_2 || p.id_document_back_url_2) && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
              ⚠ This member has re-uploaded one or more documents. Compare originals vs. new uploads to verify identity consistency.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}