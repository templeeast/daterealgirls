import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Shield, MessageCircle, ImageIcon, Loader2, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending:  { label: 'Pending',  className: 'border-amber-300 text-amber-700 bg-amber-50' },
  approved: { label: 'Approved', className: 'border-green-300 text-green-700 bg-green-50' },
  rejected: { label: 'Rejected', className: 'border-red-300 text-red-700 bg-red-50' },
};

function ImageCell({ label, url }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      {url ? (
        <img src={url} alt={label} className="w-full rounded-xl border object-contain bg-muted" style={{ maxHeight: 300 }} />
      ) : (
        <div className="w-full rounded-xl bg-muted flex items-center justify-center" style={{ height: 200 }}>
          <p className="text-xs text-muted-foreground">Identity image not available</p>
        </div>
      )}
    </div>
  );
}

export default function PhotoReviewCard({ review, onApprove, onReject }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[review.review_status] || STATUS_MAP.pending;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [diditImages, setDiditImages] = useState(null);

  const handleVerifyClick = async () => {
    setModalOpen(true);
    setDiditImages(null);
    if (!review.source_profile_id) return;

    setModalLoading(true);
    const profiles = await base44.entities.MemberProfile.filter({ id: review.source_profile_id });
    const profile = profiles[0];

    if (profile?.didit_session_id) {
      const res = await base44.functions.invoke('fetchDiditSession', { sessionId: profile.didit_session_id });
      setDiditImages(res.data ?? res);
    }
    setModalLoading(false);
  };

  const handleApprove = () => {
    setModalOpen(false);
    onApprove(review);
  };

  const handleReject = () => {
    setModalOpen(false);
    onReject(review);
  };

  const col1Label = review.source_type === 'private' ? (review.media_type === 'video' ? '🔒 Private Video' : '🔒 Private Photo') : 'Submitted Content';

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-muted relative">
          {review.photo_url ? (
            review.media_type === 'video' ? (
              <>
                <img src={review.thumbnail_url || review.photo_url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-3">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                </div>
              </>
            ) : (
              <img src={review.photo_url} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          <Badge className={`absolute top-2 right-2 ${status.className}`}>
            {status.label}
          </Badge>
          <Badge
            variant="secondary"
            className={`absolute top-2 left-2 text-xs ${review.source_type === 'private' ? 'bg-amber-100 text-amber-700 border-amber-300' : ''}`}
          >
            {review.source_type === 'profile' ? 'Profile' : review.source_type === 'private' ? (review.media_type === 'video' ? '🔒 Private Video' : '🔒 Private Photo') : (review.media_type === 'video' ? 'Chat Video' : 'Chat')}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {review.source_description || 'Unknown source'}
          </p>

          {review.rejection_reason && (
            <p className="text-xs text-destructive">
              Reason: {review.rejection_reason.replace(/_/g, ' ')}
            </p>
          )}

          {review.uploaded_date && (
            <p className="text-xs text-muted-foreground">
              Uploaded: {format(new Date(review.uploaded_date), 'MMM d, yyyy h:mm a')}
            </p>
          )}
          {review.reviewed_date && (
            <p className="text-xs text-muted-foreground">
              {review.review_status === 'approved' ? 'Approved' : 'Rejected'}: {format(new Date(review.reviewed_date), 'MMM d, yyyy')}
            </p>
          )}

          {/* Quick links */}
          <div className="flex flex-wrap gap-1">
            {review.source_profile_id && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                onClick={() => navigate(`/profile/${review.source_profile_id}`)}>
                <Eye className="w-3 h-3" /> Profile
              </Button>
            )}
            {review.source_profile_id && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                onClick={handleVerifyClick}>
                <Shield className="w-3 h-3" /> Verify
              </Button>
            )}
            {review.source_conversation_id && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                onClick={() => navigate(`/chat/${review.source_conversation_id}`)}>
                <MessageCircle className="w-3 h-3" /> Chat
              </Button>
            )}
          </div>

          {/* Actions */}
          {review.review_status === 'pending' && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline"
                className="flex-1 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => onApprove(review)}>
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline"
                className="flex-1 gap-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => onReject(review)}>
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Identity Comparison Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Identity Comparison</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
            <ImageCell label={col1Label} url={review.media_type === 'video' ? (review.thumbnail_url || review.photo_url) : review.photo_url} />
            {modalLoading ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Member Selfie</p>
                  <div className="w-full rounded-xl bg-muted flex items-center justify-center" style={{ height: 200 }}>
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Govt ID (Front)</p>
                  <div className="w-full rounded-xl bg-muted flex items-center justify-center" style={{ height: 200 }}>
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <ImageCell label="Member Selfie" url={diditImages?.selfie_image} />
                <ImageCell label="Govt ID (Front)" url={diditImages?.id_front_image} />
              </>
            )}
          </div>

          {review.review_status === 'pending' && (
            <DialogFooter className="flex gap-2 sm:flex-row">
              <Button variant="outline"
                className="flex-1 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                onClick={handleApprove}>
                <CheckCircle className="w-4 h-4" /> Approve
              </Button>
              <Button variant="outline"
                className="flex-1 gap-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={handleReject}>
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}