import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, LifeBuoy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

export default function SuspensionScreen({ profile }) {
  const navigate = useNavigate();

  // suspension_reason is a combined "reason — details" string stored by the admin suspend flow
  const combined = profile?.suspension_reason || '';
  const separatorIdx = combined.indexOf(' — ');
  const reason = separatorIdx >= 0 ? combined.slice(0, separatorIdx) : combined;
  const details = separatorIdx >= 0 ? combined.slice(separatorIdx + 3) : '';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-2 border-destructive/20">
        <CardContent className="pt-8 pb-8 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold">Account Suspended</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account has been suspended by our moderation team. You are unable to browse, message, or interact with other members until this is resolved.
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-left space-y-3">
            {reason && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Suspension Reason
                </p>
                <p className="text-sm font-medium">{reason}</p>
              </div>
            )}
            {details && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Additional Details
                </p>
                <p className="text-sm leading-relaxed">{details}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            If you believe this is an error or would like to appeal, please contact support.
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={() => navigate('/support')} className="gap-2 w-full">
              <LifeBuoy className="w-4 h-4" />
              Contact Support
            </Button>
            <Button variant="outline" onClick={() => base44.auth.logout(window.location.href)} className="gap-2 w-full">
              <LogOut className="w-4 h-4" />
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}