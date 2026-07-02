import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function VerifyComplete() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pageStatus, setPageStatus] = useState('loading'); // loading | approved | declined | pending | error
  const [profile, setProfile] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const verificationSessionId = params.get('verificationSessionId');
  const verificationStatus    = params.get('status');

  useEffect(() => {
    (async () => {
      if (!verificationSessionId) {
        setPageStatus('error');
        return;
      }

      const profiles = await base44.entities.MemberProfile.filter({
        didit_session_id: verificationSessionId,
      });
      const p = profiles[0];
      if (!p) {
        setPageStatus('error');
        return;
      }
      setProfile(p);

      if (verificationStatus === 'Approved') {
        await base44.entities.MemberProfile.update(p.id, {
          didit_verification_status: 'Approved',
          didit_verified_at:         new Date().toISOString(),
          verification_status:       'verified',
        });
        toast({ title: '🎉 Identity verified! Welcome to DateRealGirls.' });
        navigate('/browse');
      } else if (verificationStatus === 'Declined') {
        await base44.entities.MemberProfile.update(p.id, {
          didit_verification_status: 'Declined',
        });
        setPageStatus('declined');
      } else {
        setPageStatus('pending');
      }
    })();
  }, [verificationSessionId, verificationStatus]);

  const handleRetry = async () => {
    if (!profile) return;
    setRetrying(true);
    const res = await base44.functions.invoke('createDiditSession', { memberId: profile.id });
    const result = res.data;
    await base44.entities.MemberProfile.update(profile.id, {
      didit_session_id:          result.session_id,
      didit_verification_status: 'pending',
    });
    window.location.href = result.url;
  };

  if (pageStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-2">
          {pageStatus === 'declined' && (
            <>
              <div className="flex justify-center mb-3">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <CardTitle className="font-heading text-xl">Verification Unsuccessful</CardTitle>
              <CardDescription>
                We were unable to verify your identity at this time. Please contact support or try again.
              </CardDescription>
            </>
          )}
          {pageStatus === 'pending' && (
            <>
              <div className="flex justify-center mb-3">
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              <CardTitle className="font-heading text-xl">Verification In Progress</CardTitle>
              <CardDescription>
                Your verification is being reviewed. This can take a few minutes. You can continue using the app in the meantime.
              </CardDescription>
            </>
          )}
          {pageStatus === 'error' && (
            <>
              <div className="flex justify-center mb-3">
                <XCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <CardTitle className="font-heading text-xl">Something Went Wrong</CardTitle>
              <CardDescription>
                We couldn't process your verification result. Please contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {pageStatus === 'declined' && (
            <Button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full gap-2"
            >
              {retrying ? <><Loader2 className="w-4 h-4 animate-spin" /> Retrying...</> : <><RefreshCw className="w-4 h-4" /> Try Again</>}
            </Button>
          )}
          <Button
            variant={pageStatus === 'declined' ? 'outline' : 'default'}
            className="w-full"
            onClick={() => navigate('/browse')}
          >
            Continue to App
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}