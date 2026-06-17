import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Eye, Shield, MessageCircle, ImageIcon, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const STATUS_MAP = {
  pending: { label: 'Pending', variant: 'outline', className: 'border-amber-300 text-amber-700 bg-amber-50' },
  approved: { label: 'Approved', variant: 'outline', className: 'border-green-300 text-green-700 bg-green-50' },
  rejected: { label: 'Rejected', variant: 'outline', className: 'border-red-300 text-red-700 bg-red-50' },
};

export default function PhotoReviewCard({ review, onApprove, onReject }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[review.review_status] || STATUS_MAP.pending;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted relative">
        {review.photo_url ? (
          <img
            src={review.photo_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${status.className}`}>
          {status.label}
        </Badge>
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
          {review.source_type === 'profile' ? 'Profile' : 'Chat'}
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

        {review.reviewed_date && (
          <p className="text-xs text-muted-foreground">
            {review.review_status === 'approved' ? 'Approved' : 'Rejected'}: {format(new Date(review.reviewed_date), 'MMM d, yyyy')}
          </p>
        )}

        {/* Quick links */}
        <div className="flex flex-wrap gap-1">
          {review.source_profile_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(`/profile/${review.source_profile_id}`)}
            >
              <Eye className="w-3 h-3" /> Profile
            </Button>
          )}
          {review.source_profile_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(`/admin?tab=verification&profile=${review.source_profile_id}`)}
            >
              <Shield className="w-3 h-3" /> Verify
            </Button>
          )}
          {review.source_conversation_id && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => navigate(`/chat/${review.source_conversation_id}`)}
            >
              <MessageCircle className="w-3 h-3" /> Chat
            </Button>
          )}
        </div>

        {/* Actions */}
        {review.review_status === 'pending' && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => onApprove(review)}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => onReject(review)}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}