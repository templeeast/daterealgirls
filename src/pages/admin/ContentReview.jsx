import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import PhotoReviewCard from '@/components/admin/PhotoReviewCard';
import RejectPhotoDialog from '@/components/admin/RejectPhotoDialog';

const TABS = [
  { value: 'all', label: 'All Photos' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

// Extract photos from profiles, private photos, and messages, cross-reference with reviews
function buildPhotoList(profiles, messages, privatePhotos, reviews) {
  const reviewMap = {};
  reviews.forEach(r => { reviewMap[r.photo_url] = r; });

  const profileMap = {};
  profiles.forEach(p => { profileMap[p.id] = p; });

  const items = [];

  // Private photos
  privatePhotos.forEach(pp => {
    const url = pp.photo_url;
    if (!url) return;
    const existing = reviewMap[url];
    const ownerProfile = profileMap[pp.member_id];
    items.push({
      photo_url: url,
      source_type: 'private',
      source_description: `Private photo of ${ownerProfile?.display_name || 'Unknown'}`,
      source_profile_id: pp.member_id,
      source_user_id: ownerProfile?.user_id || '',
      source_field: 'private_photo',
      source_message_id: null,
      source_conversation_id: null,
      review_status: existing?.review_status || 'pending',
      rejection_reason: existing?.rejection_reason || null,
      reviewed_date: existing?.updated_date || null,
      review_id: existing?.id || null,
      uploaded_date: pp.uploaded_at || pp.created_date || null,
    });
  });

  // Profile photos
  profiles.forEach(p => {
    for (let i = 1; i <= 15; i++) {
      const field = `photo_${i}`;
      const url = p[field];
      if (!url) continue;

      const existing = reviewMap[url];
      items.push({
        photo_url: url,
        source_type: 'profile',
        source_description: `Profile photo #${i} of ${p.display_name || 'Unknown'}`,
        source_profile_id: p.id,
        source_user_id: p.user_id,
        source_field: field,
        source_message_id: null,
        source_conversation_id: null,
        review_status: existing?.review_status || 'pending',
        rejection_reason: existing?.rejection_reason || null,
        reviewed_date: existing?.updated_date || null,
        review_id: existing?.id || null,
        uploaded_date: null,
      });
    }
  });

  // Chat images
  messages.forEach(m => {
    if (!m.image_url) return;
    const url = m.image_url;
    const existing = reviewMap[url];
    items.push({
      photo_url: url,
      source_type: 'chat',
      source_description: `Chat image from ${m.sender_name || 'Unknown'} in conversation`,
      source_profile_id: null,
      source_user_id: m.sender_id,
      source_field: null,
      source_message_id: m.id,
      source_conversation_id: m.conversation_id,
      review_status: existing?.review_status || 'pending',
      rejection_reason: existing?.rejection_reason || null,
      reviewed_date: existing?.updated_date || null,
      review_id: existing?.id || null,
      uploaded_date: m.created_date || null,
    });
  });

  return items;
}

export default function ContentReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin', 'profiles', 'withPhotos'],
    queryFn: () => base44.entities.MemberProfile.list(),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['admin', 'messages', 'withImages'],
    queryFn: async () => {
      const all = await base44.entities.Message.list('-created_date', 2000);
      return all.filter(m => m.image_url);
    },
  });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['photoReviews'],
    queryFn: () => base44.entities.PhotoReview.list('-created_date', 5000),
  });

  const { data: privatePhotos = [], isLoading: loadingPrivatePhotos } = useQuery({
    queryKey: ['admin', 'privatePhotos'],
    queryFn: () => base44.entities.PrivatePhoto.list('-uploaded_at', 5000),
  });

  const allPhotos = useMemo(
    () => buildPhotoList(profiles, messages, privatePhotos, reviews),
    [profiles, messages, privatePhotos, reviews]
  );

  const filteredPhotos = useMemo(() => {
    let list = allPhotos;
    if (activeTab !== 'all') {
      list = list.filter(p => p.review_status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.source_description.toLowerCase().includes(q));
    }
    return list;
  }, [allPhotos, activeTab, search]);

  const approveMutation = useMutation({
    mutationFn: async (photo) => {
      const data = {
        photo_url: photo.photo_url,
        source_type: photo.source_type,
        source_description: photo.source_description,
        source_profile_id: photo.source_profile_id || '',
        source_user_id: photo.source_user_id || '',
        source_field: photo.source_field || '',
        source_message_id: photo.source_message_id || '',
        source_conversation_id: photo.source_conversation_id || '',
        review_status: 'approved',
      };
      if (photo.review_id) {
        await base44.entities.PhotoReview.update(photo.review_id, { review_status: 'approved' });
      } else {
        await base44.entities.PhotoReview.create(data);
      }
      // Sync PrivatePhoto status
      if (photo.source_type === 'private') {
        const privPhotos = await base44.entities.PrivatePhoto.filter({ photo_url: photo.photo_url });
        if (privPhotos[0]) await base44.entities.PrivatePhoto.update(privPhotos[0].id, { status: 'approved' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoReviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'privatePhotos'] });
      toast({ title: 'Photo approved' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ photo, reason }) => {
      // 1. Clear photo from source entity
      if (photo.source_type === 'profile' && photo.source_profile_id && photo.source_field) {
        await base44.entities.MemberProfile.update(photo.source_profile_id, {
          [photo.source_field]: '',
        });
      } else if (photo.source_type === 'chat' && photo.source_message_id) {
        await base44.entities.Message.update(photo.source_message_id, {
          image_url: '',
        });
      } else if (photo.source_type === 'private') {
        const privPhotos = await base44.entities.PrivatePhoto.filter({ photo_url: photo.photo_url });
        if (privPhotos[0]) await base44.entities.PrivatePhoto.update(privPhotos[0].id, { status: 'rejected' });
      }

      // 2. Create/update PhotoReview record
      const reviewData = {
        photo_url: photo.photo_url,
        source_type: photo.source_type,
        source_description: photo.source_description,
        source_profile_id: photo.source_profile_id || '',
        source_user_id: photo.source_user_id || '',
        source_field: photo.source_field || '',
        source_message_id: photo.source_message_id || '',
        source_conversation_id: photo.source_conversation_id || '',
        review_status: 'rejected',
        rejection_reason: reason,
      };

      if (photo.review_id) {
        await base44.entities.PhotoReview.update(photo.review_id, {
          review_status: 'rejected',
          rejection_reason: reason,
        });
      } else {
        await base44.entities.PhotoReview.create(reviewData);
      }

      // 3. Notify user via email
      if (photo.source_user_id) {
        try {
          const users = await base44.entities.User.filter({ id: photo.source_user_id });
          const user = users[0];
          if (user?.email) {
            const reasonLabel = reason.replace(/_/g, ' ');
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: 'Your photo has been reviewed',
              body: `Hello,\n\nYour photo has been reviewed and was rejected for the following reason: ${reasonLabel}.\n\nSource: ${photo.source_description}\n\nIf you have any questions, please contact support.\n\nThank you.`,
            });
          }
        } catch (e) {
          // Email failure shouldn't block the rejection
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoReviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'profiles', 'withPhotos'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages', 'withImages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'privatePhotos'] });
      toast({ title: 'Photo rejected and deleted' });
    },
  });

  const isLoading = loadingProfiles || loadingMessages || loadingReviews || loadingPrivatePhotos;

  const counts = useMemo(() => ({
    all: allPhotos.length,
    pending: allPhotos.filter(p => p.review_status === 'pending').length,
    approved: allPhotos.filter(p => p.review_status === 'approved').length,
    rejected: allPhotos.filter(p => p.review_status === 'rejected').length,
  }), [allPhotos]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Content Review</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review and moderate uploaded photos across profiles and chats
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{counts.all} total photos</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by source description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full sm:w-auto">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
              {tab.label}
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {counts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No photos found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo, i) => (
            <PhotoReviewCard
              key={photo.photo_url + i}
              review={photo}
              onApprove={(p) => approveMutation.mutate(p)}
              onReject={(p) => setRejectTarget(p)}
            />
          ))}
        </div>
      )}

      {/* Reject Dialog */}
      <RejectPhotoDialog
        open={!!rejectTarget}
        onOpenChange={(v) => { if (!v) setRejectTarget(null); }}
        photo={rejectTarget}
        onConfirm={(photo, reason) => rejectMutation.mutate({ photo, reason })}
      />
    </div>
  );
}