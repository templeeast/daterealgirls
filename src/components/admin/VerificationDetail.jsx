import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

const REASON_OPTIONS = [
  { value: 'fake_profile', labelKey: 'rej_reason_fake_profile' },
  { value: 'underage', labelKey: 'rej_reason_underage' },
  { value: 'invalid_id', labelKey: 'rej_reason_invalid_id' },
  { value: 'photo_mismatch', labelKey: 'rej_reason_photo_mismatch' },
  { value: 'inappropriate_content', labelKey: 'rej_reason_inappropriate_content' },
  { value: 'duplicate_account', labelKey: 'rej_reason_duplicate_account' },
  { value: 'incomplete_verification', labelKey: 'rej_reason_incomplete_verification' },
  { value: 'other', labelKey: 'rej_reason_other' },
];

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
  const { t } = useTranslation();
  const [diditImages, setDiditImages]   = useState(null);
  const [diditLoading, setDiditLoading] = useState(false);
  const [diditError, setDiditError]     = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDetails, setRejectDetails] = useState('');

  useEffect(() => {
    if (!p.didit_session_id) return;
    let stale = false;
    setDiditLoading(true);
    setDiditImages(null);
    setDiditError(null);
    base44.functions.invoke('fetchDiditSession', { sessionId: p.didit_session_id })
      .then(res  => { if (!stale) setDiditImages(res.data ?? res); })
      .catch(err => { if (!stale) setDiditError(err.message); })
      .finally(() => { if (!stale) setDiditLoading(false); });
    return () => { stale = true; };
  }, [p.didit_session_id, p.id]);

  const handleConfirmReject = () => {
    onVerify(p.id, 'rejected', 'rejected', {
      rejectionReason: rejectReason,
      rejectionDetails: rejectDetails,
    });
    setShowRejectDialog(false);
    setRejectReason('');
    setRejectDetails('');
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
            <div className="space-y-1">
              <h3 className="font-medium text-base">{p.display_name}, {p.age}</h3>
              <p className="text-sm text-muted-foreground capitalize">{p.gender} · {[p.location_city, p.location_country].filter(Boolean).join(', ')}</p>
              <DiditStatusBadge profile={p} />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="gap-1" onClick={() => onVerify(p.id, 'approved', 'verified')}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => setShowRejectDialog(true)}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </div>
          </div>

          {/* Gender Mismatch Warning */}
          {p.gender_review_needed && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Gender Review Required</p>
              </div>
              <p className="text-xs text-amber-700">
                Profile gender: <span className="font-medium capitalize">{p.gender}</span>
                {' · '}
                Didit ID gender: <span className="font-medium">{p.didit_extracted_gender === 'M' ? 'Male' : p.didit_extracted_gender === 'F' ? 'Female' : 'Unknown'}</span>
              </p>
              <p className="text-xs text-amber-600">
                Didit approved the ID, but the gender on the document {p.didit_extracted_gender === 'U' || !p.didit_extracted_gender ? 'could not be determined' : 'does not match'} the profile gender. Please review the ID images and approve or reject manually.
              </p>
            </div>
          )}

          {/* Age Mismatch / Underage Warning */}
          {p.age_review_needed && (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Age Review Required</p>
              </div>
              <p className="text-xs text-amber-700">
                Profile age: <span className="font-medium">{p.age ?? '—'}</span>
                {p.date_of_birth && <> {' · '} Profile DOB: <span className="font-medium">{p.date_of_birth}</span></>}
                {p.didit_age != null && <> {' · '} Didit ID age: <span className="font-medium">{p.didit_age}</span></>}
                {p.didit_date_of_birth && <> {' · '} Didit ID DOB: <span className="font-medium">{p.didit_date_of_birth}</span></>}
              </p>
              <p className="text-xs text-amber-600">
                {p.didit_age != null && p.didit_age < 18
                  ? 'The ID document indicates the holder is under 18. This profile must be rejected — do not approve.'
                  : p.didit_age == null
                    ? 'Didit could not extract an age or date of birth from the ID document. Please review the ID images and approve or reject manually.'
                    : 'Didit approved the ID, but the age/date of birth on the document does not match the age the member entered on their profile. Please review the ID images and approve or reject manually.'}
              </p>
            </div>
          )}

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

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rej_dialog_title')}</DialogTitle>
            <DialogDescription>{t('rej_dialog_desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('rej_reason_label')}</Label>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('rej_reason_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('rej_details_label')}</Label>
              <Textarea
                value={rejectDetails}
                onChange={e => setRejectDetails(e.target.value)}
                placeholder={t('rej_details_placeholder')}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('rej_cancel_btn')}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason}
              onClick={handleConfirmReject}
            >
              {t('rej_confirm_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}