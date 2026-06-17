import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'content_violation', label: 'Content Violation' },
  { value: 'does_not_match_selfie', label: 'Does Not Match Selfie' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'copyright_infringement', label: 'Copyright Infringement' },
  { value: 'low_quality', label: 'Low Quality / Blurry' },
  { value: 'spam_solicitation', label: 'Spam / Solicitation' },
  { value: 'other', label: 'Other' },
];

export default function RejectPhotoDialog({ open, onOpenChange, photo, onConfirm }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason) return;
    setSubmitting(true);
    await onConfirm(photo, reason);
    setSubmitting(false);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setReason(''); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Reject Photo
          </DialogTitle>
          <DialogDescription>
            Select a reason for rejecting this photo. The photo will be deleted and the user will be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {photo?.photo_url && (
            <img
              src={photo.photo_url}
              alt="Preview"
              className="w-full max-h-48 object-cover rounded-lg border"
            />
          )}
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select rejection reason..." />
            </SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason || submitting}>
            {submitting ? 'Rejecting...' : 'Reject & Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}