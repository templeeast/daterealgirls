import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flag, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import useMyProfile from '@/hooks/useMyProfile';
import { useTranslation } from 'react-i18next';

const REASON_KEYS = [
  { value: 'fake_profile', key: 'reason_fake' },
  { value: 'harassment', key: 'reason_harassment' },
  { value: 'inappropriate_content', key: 'reason_inappropriate' },
  { value: 'underage', key: 'reason_underage' },
  { value: 'spam', key: 'reason_spam' },
  { value: 'other', key: 'reason_other' },
];

export default function ReportProfile() {
  const profileId = window.location.pathname.split('/report/')[1];
  const navigate = useNavigate();
  const { user } = useMyProfile();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await base44.entities.UserReport.create({
      reporter_id: user.id,
      reported_profile_id: profileId,
      reason,
      details,
    });
    toast({ title: t('report_submitted') });
    navigate(-1);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> {t('report_back')}
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <CardTitle className="font-heading text-xl">{t('report_title')}</CardTitle>
          </div>
          <CardDescription>{t('report_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('reason_label')}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder={t('select_reason')} /></SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map(r => <SelectItem key={r.value} value={r.value}>{t(r.key)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('additional_details')}</Label>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder={t('details_placeholder')}
              className="h-32"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? t('submitting') : t('submit_report')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}