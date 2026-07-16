import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, UserCheck, UserX, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import VerificationRequiredModal from '@/components/shared/VerificationRequiredModal';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useNavigate } from 'react-router-dom';

const requiresIdVerification = (p) => p?.didit_verification_status === 'Approved';

export default function PrivatePhotosSection({ profile, onRefetch, maxPrivatePhotos = 10 }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { config } = useSiteConfig();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const { data: privatePhotos = [], refetch } = useQuery({
    queryKey: ['privatePhotos', profile.id],
    queryFn: () => base44.entities.PrivatePhoto.filter({ member_id: profile.id }, '-uploaded_at'),
    enabled: !!profile.id,
  });

  const { data: pendingRequests = [], refetch: refetchPending } = useQuery({
    queryKey: ['privatePhotoAccessPending', profile.id],
    queryFn: () => base44.entities.PrivatePhotoAccess.filter({ owner_member_id: profile.id, status: 'pending' }),
    enabled: !!profile.id,
  });

  const { data: grantedAccess = [], refetch: refetchGranted } = useQuery({
    queryKey: ['privatePhotoAccessGranted', profile.id],
    queryFn: () => base44.entities.PrivatePhotoAccess.filter({ owner_member_id: profile.id, status: 'granted' }),
    enabled: !!profile.id,
  });

  // Fetch viewer profiles for pending requests + granted
  const allAccessIds = [...pendingRequests, ...grantedAccess].map(r => r.viewer_member_id);
  const { data: viewerProfiles = [] } = useQuery({
    queryKey: ['viewerProfiles', allAccessIds.join(',')],
    queryFn: async () => {
      if (allAccessIds.length === 0) return [];
      const results = await Promise.all(
        allAccessIds.map(id => base44.entities.MemberProfile.filter({ id }).then(r => r[0]).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: allAccessIds.length > 0,
  });

  const getViewerProfile = (viewerMemberId) => viewerProfiles.find(p => p.id === viewerMemberId);

  const isMale = profile.gender === 'male';
  const uploadCost = isMale ? 10 : 0;
  const videosPrivateEnabled = isMale ? (config?.videos_private_men_enabled === true) : (config?.videos_private_women_enabled === true);

  const handleUploadClick = () => {
    setUploadError('');
    if (!requiresIdVerification(profile)) { setShowVerifModal(true); return; }
    if (isMale && (profile.tokens || 0) < 10) {
      setUploadError('You need 10 tokens to post a private photo.');
      return;
    }
    fileRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const nonRejected = privatePhotos.filter(p => p.status !== 'rejected');
    if (nonRejected.length >= maxPrivatePhotos) {
      setUploadError(`You've reached the maximum of ${maxPrivatePhotos} private photos. Delete an existing private photo to upload a new one.`);
      return;
    }
    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';
    if (isVideo) {
      const maxDuration = config?.max_video_duration_seconds ?? 30;
      const maxSizeMB = config?.max_video_file_size_mb ?? 25;
      if (file.size > maxSizeMB * 1024 * 1024) {
        setUploadError(t('chat_video_too_large', { n: maxSizeMB }));
        return;
      }
      try {
        const duration = await new Promise((resolve, reject) => {
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          videoEl.onloadedmetadata = () => resolve(videoEl.duration);
          videoEl.onerror = () => reject(new Error('metadata'));
          videoEl.src = URL.createObjectURL(file);
        });
        if (duration > maxDuration) {
          setUploadError(t('chat_video_too_long', { n: maxDuration }));
          return;
        }
      } catch (err) {
        setUploadError('Could not validate video. Please try a different file.');
        return;
      }
    }
    setUploading(true);
    setUploadError('');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await base44.functions.invoke('uploadToCloudinary', { file: base64, filename: file.name, media_type: mediaType, content_type: file.type });
      const mediaUrl = res.data?.url;
      const thumbnailUrl = res.data?.thumbnail_url;
      if (!mediaUrl) { setUploadError('Upload failed. Please try again.'); setUploading(false); return; }
      const tokenCostToView = isMale ? (isVideo ? (config?.tokens_private_video_cost ?? 10) : 5) : 0;
      if (isMale && uploadCost > 0) {
        await base44.entities.MemberProfile.update(profile.id, { tokens: Math.max(0, (profile.tokens || 0) - uploadCost) });
        await base44.entities.TokenTransaction.create({ user_id: profile.user_id, type: 'spend', tokens: -uploadCost, description: `Private ${mediaType} upload fee` });
      }
      await base44.entities.PrivatePhoto.create({ member_id: profile.id, photo_url: mediaUrl, media_type: mediaType, thumbnail_url: thumbnailUrl || '', status: 'approved', token_cost_to_view: tokenCostToView, uploaded_at: new Date().toISOString() });
      await base44.entities.PhotoReview.create({ photo_url: mediaUrl, media_type: mediaType, thumbnail_url: thumbnailUrl || '', source_type: 'private', source_description: `Private ${mediaType} of ${profile.display_name || 'Unknown'}`, source_profile_id: profile.id, source_user_id: profile.user_id, source_field: 'private_photo', review_status: 'pending' });
      toast({ title: `Your private ${mediaType} has been uploaded and is now visible.` });
      refetch();
      if (onRefetch) onRefetch();
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (photo) => {
    await base44.entities.PrivatePhoto.update(photo.id, { status: 'rejected' });
    refetch();
  };

  const handleRespond = async (accessId, response) => {
    setRespondingId(accessId);
    const res = await base44.functions.invoke('respondToPrivatePhotoAccess', { accessId, response });
    const data = res.data ?? res;
    setRespondingId(null);
    if (data.success) {
      toast({ title: response === 'granted' ? 'Access granted!' : 'Request denied.' });
      refetchPending();
      refetchGranted();
      queryClient.invalidateQueries({ queryKey: ['viewerProfiles'] });
    } else {
      toast({ title: data.error || 'Error', variant: 'destructive' });
    }
  };

  const handleRevoke = async (viewerMemberId, accessId) => {
    setRevokingId(accessId);
    const res = await base44.functions.invoke('revokePrivatePhotoAccess', { viewerMemberId });
    const data = res.data ?? res;
    setRevokingId(null);
    if (data.success) {
      toast({ title: 'Access revoked.' });
      refetchGranted();
    } else {
      toast({ title: data.error || 'Error', variant: 'destructive' });
    }
  };

  const displayPhotos = privatePhotos.filter(p => p.status !== 'rejected');

  return (
    <>
      <VerificationRequiredModal open={showVerifModal} onClose={() => setShowVerifModal(false)} onVerify={() => navigate('/onboarding')} />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">🔒 Private Photos</CardTitle>
          <CardDescription>{videosPrivateEnabled ? t(isMale ? 'private_photos_videos_desc_men' : 'private_photos_videos_desc_women', { n: maxPrivatePhotos }) : t('private_photos_desc', { n: maxPrivatePhotos })}</CardDescription>
          <p className="text-xs text-primary font-medium mt-2">{t('private_photos_creator_earnings_desc', { percentage: config?.private_media_creator_share_percentage ?? 80 })}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadError && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {uploadError}
              {uploadError.includes('tokens') && (
                <button className="ml-2 underline text-primary" onClick={() => document.getElementById('buy-tokens')?.scrollIntoView({ behavior: 'smooth' })}>Get Tokens →</button>
              )}
            </div>
          )}

          <Button variant="outline" className="gap-2" onClick={handleUploadClick} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : `Upload Private ${videosPrivateEnabled ? 'Photo/Video' : 'Photo'}${isMale ? ' (10 tokens)' : ''}`}
          </Button>
          <input ref={fileRef} type="file" accept={videosPrivateEnabled ? "image/*,video/*" : "image/*"} className="hidden" onChange={handleFileChange} />

          {displayPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {displayPhotos.map(photo => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border">
                  {photo.media_type === 'video' ? (
                    <>
                      <img src={photo.thumbnail_url || photo.photo_url} alt="" className={`w-full h-full object-cover ${photo.status === 'pending_review' ? 'opacity-50' : ''}`} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 rounded-full p-2">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <img src={photo.photo_url} alt="" className={`w-full h-full object-cover ${photo.status === 'pending_review' ? 'opacity-50' : ''}`} />
                  )}
                  {photo.status === 'pending_review' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white text-xs font-medium text-center px-1">⏳ Under Review</span>
                    </div>
                  )}
                  <button onClick={() => handleDelete(photo)} className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pending Access Requests */}
          {pendingRequests.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold">Pending Access Requests</p>
              {pendingRequests.map(req => {
                const viewer = getViewerProfile(req.viewer_member_id);
                return (
                  <div key={req.id} className="flex items-center justify-between gap-3 bg-muted rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      {viewer?.photo_1 ? (
                        <img src={viewer.photo_1} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">👤</div>
                      )}
                      <span className="text-sm font-medium">{viewer?.display_name || 'Unknown'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50" disabled={respondingId === req.id} onClick={() => handleRespond(req.id, 'granted')}>
                        {respondingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Grant
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50" disabled={respondingId === req.id} onClick={() => handleRespond(req.id, 'denied')}>
                        <UserX className="w-3 h-3" /> Deny
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Access Granted To */}
          {grantedAccess.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold">Access Granted To</p>
              {grantedAccess.map(acc => {
                const viewer = getViewerProfile(acc.viewer_member_id);
                return (
                  <div key={acc.id} className="flex items-center justify-between gap-3 bg-muted rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      {viewer?.photo_1 ? (
                        <img src={viewer.photo_1} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">👤</div>
                      )}
                      <span className="text-sm font-medium">{viewer?.display_name || 'Unknown'}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" disabled={revokingId === acc.id} onClick={() => handleRevoke(acc.viewer_member_id, acc.id)}>
                      {revokingId === acc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}