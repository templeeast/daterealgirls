import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

const statusConfig = {
  Approved: {
    label: 'Verified',
    badge: 'bg-green-100 text-green-700',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    desc: 'Your identity has been verified. You now have full access to all platform features.',
  },
  Declined: {
    label: 'Declined',
    badge: 'bg-destructive/10 text-destructive',
    icon: <XCircle className="w-5 h-5 text-destructive" />,
    desc: 'Your verification was declined. Please try again with a clear photo of a valid government ID.',
  },
  pending: {
    label: 'In Review',
    badge: 'bg-amber-100 text-amber-700',
    icon: <Clock className="w-5 h-5 text-amber-500" />,
    desc: 'Your verification is in progress. This usually takes just a few minutes.',
  },
  not_started: {
    label: 'Not Verified',
    badge: 'bg-muted text-muted-foreground',
    icon: <Shield className="w-5 h-5 text-muted-foreground" />,
    desc: 'Verify your identity to unlock messaging, private photos, and full platform access.',
  },
};

export default function DiditVerificationCard({ profile, onRefetch }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const diditStatus = profile?.didit_verification_status || 'not_started';
  const cfg = statusConfig[diditStatus] || statusConfig.not_started;
  const isApproved = diditStatus === 'Approved';
  const canRetry = diditStatus === 'Declined' || diditStatus === 'not_started';

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('createDiditSession', { memberId: profile.id });
    const result = res.data ?? res;
    if (!result?.url) {
      setError('Could not start verification. Please try again.');
      setLoading(false);
      return;
    }
    await base44.entities.MemberProfile.update(profile.id, {
      didit_session_id: result.session_id,
      didit_verification_status: 'pending',
    });
    window.location.href = result.url;
  };

  return (
    <Card className={`mb-6 ${isApproved ? 'border-green-200 bg-green-50/50' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isApproved ? 'bg-green-100' : 'bg-muted'}`}>
              {cfg.icon}
            </div>
            <div>
              <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                Identity Verification
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{cfg.desc}</p>
            </div>
          </div>
          <Badge className={`shrink-0 ${cfg.badge}`}>{cfg.label}</Badge>
        </div>

        {!isApproved && (
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
              <span>You'll be redirected to our secure partner Didit to complete a quick document + selfie check. Your data is encrypted and never stored on our servers.</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {canRetry && (
              <Button onClick={handleVerify} disabled={loading} className="gap-2 w-full">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Launching verification...</>
                ) : (
                  <><Shield className="w-4 h-4" /> {diditStatus === 'Declined' ? 'Retry Verification' : 'Verify My Identity'}</>
                )}
              </Button>
            )}
            {diditStatus === 'pending' && (
              <Button variant="outline" onClick={handleVerify} disabled={loading} className="gap-2 w-full text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Restart Verification
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}