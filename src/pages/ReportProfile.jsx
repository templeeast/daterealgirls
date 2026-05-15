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

const REASONS = [
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'underage', label: 'Suspected Underage User' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

export default function ReportProfile() {
  const profileId = window.location.pathname.split('/report/')[1];
  const navigate = useNavigate();
  const { user } = useMyProfile();
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
    toast({ title: 'Report submitted. Our team will review it.' });
    navigate(-1);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <CardTitle className="font-heading text-xl">Report Profile</CardTitle>
          </div>
          <CardDescription>Help us keep the community safe. All reports are reviewed by our team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Additional Details</Label>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Please provide more details..."
              className="h-32"
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!reason || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}