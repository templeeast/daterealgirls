import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldX, LifeBuoy, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';

const REASON_KEYS = {
  fake_profile: 'rej_reason_fake_profile',
  underage: 'rej_reason_underage',
  invalid_id: 'rej_reason_invalid_id',
  photo_mismatch: 'rej_reason_photo_mismatch',
  inappropriate_content: 'rej_reason_inappropriate_content',
  duplicate_account: 'rej_reason_duplicate_account',
  incomplete_verification: 'rej_reason_incomplete_verification',
  other: 'rej_reason_other',
};

export default function RejectionScreen({ profile }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const reasonKey = REASON_KEYS[profile?.verification_rejection_reason];
  const reasonText = reasonKey ? t(reasonKey) : t('rej_screen_no_reason');

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-2 border-destructive/20">
        <CardContent className="pt-8 pb-8 space-y-5 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold">{t('rej_screen_title')}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('rej_screen_desc')}</p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-left space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                {t('rej_screen_reason_label')}
              </p>
              <p className="text-sm font-medium">{reasonText}</p>
            </div>
            {profile?.verification_rejection_details && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  {t('rej_screen_details_label')}
                </p>
                <p className="text-sm leading-relaxed">{profile.verification_rejection_details}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{t('rej_screen_support_msg')}</p>

          <div className="flex flex-col gap-2 pt-1">
            <Button onClick={() => navigate('/support')} className="gap-2 w-full">
              <LifeBuoy className="w-4 h-4" />
              {t('rej_screen_contact_support')}
            </Button>
            <Button variant="outline" onClick={() => base44.auth.logout(window.location.href)} className="gap-2 w-full">
              <LogOut className="w-4 h-4" />
              {t('rej_screen_logout')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}