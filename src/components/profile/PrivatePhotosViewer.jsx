import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PhotoZoomModal from '@/components/profile/PhotoZoomModal';
import VerificationRequiredModal from '@/components/shared/VerificationRequiredModal';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useTranslation } from 'react-i18next';

const requiresIdVerification = (p) => p?.verification_status === 'verified' || p?.didit_verification_status === 'Approved';

export default function PrivatePhotosViewer({ ownerProfileId, myProfile }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [requesting, setRequesting] = useState(false);
  const [confirmPhoto, setConfirmPhoto] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [zoomIndex, setZoomIndex] = useState(null);
  const [showVerifModal, setShowVerifModal] = useState(false);
  const { config } = useSiteConfig();
  const { t } = useTranslation();

  const { data: photos = [] } = useQuery({
    queryKey: ['privatePhotos', ownerProfileId],
    queryFn: () => base44.entities.PrivatePhoto.filter({ member_id: ownerProfileId }),
    enabled: !!ownerProfileId,
  });

  const { data: accessRecords = [], refetch: refetchAccess } = useQuery({
    queryKey: ['privatePhotoAccess', ownerProfileId, myProfile?.id],
    queryFn: () => base44.entities.PrivatePhotoAccess.filter({
      owner_member_id: ownerProfileId,
      viewer_member_id: myProfile.id,
    }),
    enabled: !!ownerProfileId && !!myProfile?.id,
  });

  const { data: myViews = [] } = useQuery({
    queryKey: ['myPrivatePhotoViews', myProfile?.id],
    queryFn: () => base44.entities.PrivatePhotoView.filter({ viewer_member_id: myProfile.id }),
    enabled: !!myProfile?.id,
  });

  const approvedPhotos = photos.filter(p => p.status !== 'rejected');
  const privatePhotoCount = approvedPhotos.filter(p => p.media_type !== 'video').length;
  const privateVideoCount = approvedPhotos.filter(p => p.media_type === 'video').length;
  const photoPart = privatePhotoCount > 0 ? t('private_photos_access_photo_count', { n: privatePhotoCount }) : null;
  const videoPart = privateVideoCount > 0 ? t('private_photos_access_video_count', { n: privateVideoCount }) : null;
  const privateMediaCountText = [photoPart, videoPart].filter(Boolean).join(` ${t('private_photos_access_and')} `);
  const accessRecord = accessRecords[0];
  const isViewerMale = myProfile?.gender === 'male';
  const paidViewSet = new Set(myViews.map(v => v.private_photo_id));
  const isUnlocked = (photo) => paidViewSet.has(photo.id) || unlockedIds.has(photo.id);
  const getViewCost = (photo) => photo.media_type === 'video'
    ? (config?.tokens_private_video_cost ?? 10)
    : (config?.tokens_private_photo_cost ?? 5);

  if (approvedPhotos.length === 0 && !accessRecord) return null;

  if (!requiresIdVerification(myProfile)) {
    return (
      <>
        <VerificationRequiredModal
          open={showVerifModal}
          onClose={() => setShowVerifModal(false)}
          onVerify={async () => {
            if (!myProfile?.id) throw new Error('Profile not found');
            const res = await base44.functions.invoke('createDiditSession', { memberId: myProfile.id });
            const result = res.data ?? res;
            if (!result?.url) throw new Error('Could not start verification. Please try again.');
            await base44.entities.MemberProfile.update(myProfile.id, {
              didit_session_id: result.session_id,
              didit_verification_status: 'pending',
            });
            window.location.href = result.url;
          }}
        />
        <Card className="mt-6">
          <CardHeader><CardTitle className="font-heading text-lg">{t('private_photos_and_videos_title')}</CardTitle></CardHeader>
          <CardContent className="text-center py-6">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">{t('private_photos_verify_to_request')}</p>
            <Button onClick={() => setShowVerifModal(true)}>{t('private_photos_verify_now')}</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const handleRequestAccess = async () => {
    if (!requiresIdVerification(myProfile)) {
      setShowVerifModal(true);
      return;
    }
    setRequesting(true);
    const res = await base44.functions.invoke('requestPrivatePhotoAccess', { ownerMemberId: ownerProfileId });
    const data = res.data ?? res;
    setRequesting(false);
    if (data.alreadyGranted) {
      toast({ title: t('private_photos_already_have_access') });
    } else if (data.alreadyPending) {
      toast({ title: t('private_photos_request_already_pending') });
    } else if (data.success) {
      toast({ title: t('private_photos_access_request_sent') });
    } else {
      toast({ title: data.error || t('private_photos_could_not_send'), variant: 'destructive' });
    }
    refetchAccess();
    queryClient.invalidateQueries({ queryKey: ['privatePhotoAccess'] });
  };

  const handlePhotoClick = async (photo) => {
    if (isUnlocked(photo)) {
      const idx = approvedPhotos.findIndex(p => p.id === photo.id);
      setZoomIndex(idx);
      return;
    }
    if (!isViewerMale) {
      await base44.entities.PrivatePhotoView.create({
        private_photo_id: photo.id,
        viewer_member_id: myProfile.id,
        viewed_at: new Date().toISOString(),
        tokens_spent: 0,
      });
      setUnlockedIds(prev => new Set([...prev, photo.id]));
      return;
    }
    setConfirmPhoto(photo);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmPhoto) return;
    const viewCost = getViewCost(confirmPhoto);
    setUnlocking(true);
    if ((myProfile.tokens || 0) < viewCost) {
      toast({ title: `You need ${viewCost} tokens to view this ${confirmPhoto.media_type === 'video' ? 'video' : 'photo'}.`, variant: 'destructive' });
      setUnlocking(false);
      setConfirmPhoto(null);
      return;
    }
    await base44.entities.MemberProfile.update(myProfile.id, {
      tokens: Math.max(0, (myProfile.tokens || 0) - viewCost),
    });
    await base44.entities.TokenTransaction.create({
      user_id: myProfile.user_id,
      type: 'spend',
      tokens: -viewCost,
      description: `Private ${confirmPhoto.media_type === 'video' ? 'video' : 'photo'} view fee`,
    });
    await base44.entities.PrivatePhotoView.create({
      private_photo_id: confirmPhoto.id,
      viewer_member_id: myProfile.id,
      viewed_at: new Date().toISOString(),
      tokens_spent: viewCost,
    });

    // Award the content creator their configurable share of the tokens
    const creatorSharePct = config?.private_media_creator_share_percentage ?? 80;
    const creatorTokens = Math.ceil((viewCost * creatorSharePct) / 100);
    if (creatorTokens > 0) {
      const ownerProfiles = await base44.entities.MemberProfile.filter({ id: ownerProfileId });
      const owner = ownerProfiles[0];
      if (owner) {
        await base44.entities.MemberProfile.update(owner.id, {
          tokens: (owner.tokens || 0) + creatorTokens,
        });
        await base44.entities.TokenTransaction.create({
          user_id: owner.user_id,
          type: 'bonus',
          tokens: creatorTokens,
          description: `Earnings from private ${confirmPhoto.media_type === 'video' ? 'video' : 'photo'} view`,
        });
      }
    }

    setUnlockedIds(prev => new Set([...prev, confirmPhoto.id]));
    setConfirmPhoto(null);
    setUnlocking(false);
  };

  const unlockedPhotos = approvedPhotos.filter(p => isUnlocked(p));

  const renderContent = () => {
    const status = accessRecord?.status;

    if (status === 'granted') {
      if (approvedPhotos.length === 0) {
        return <p className="text-sm text-muted-foreground">{t('private_photos_no_approved')}</p>;
      }
      return (
        <div className="grid grid-cols-3 gap-3">
          {approvedPhotos.map(photo => {
            const unlocked = isUnlocked(photo);
            return (
              <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border cursor-pointer" onClick={() => handlePhotoClick(photo)}>
                {unlocked && photo.media_type === 'video' ? (
                  <video src={photo.photo_url} poster={photo.thumbnail_url} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={photo.media_type === 'video' && photo.thumbnail_url ? photo.thumbnail_url : photo.photo_url} alt="" className={`w-full h-full object-cover transition-all ${unlocked ? '' : 'blur-xl scale-110'}`} />
                )}
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                    <Lock className="w-6 h-6 text-white mb-1" />
                    <span className="text-white text-xs font-medium">{isViewerMale ? `${getViewCost(photo)} tokens to unlock` : 'Tap to view'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="text-center py-4 space-y-2">
          <div className="grid grid-cols-3 gap-3 mb-3 pointer-events-none select-none">
            {Array(Math.min(approvedPhotos.length || 3, 3)).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted-foreground/15 border border-muted-foreground/20 flex flex-col items-center justify-center gap-1">
                {approvedPhotos[i]?.media_type === 'video' && <Video className="w-5 h-5 text-muted-foreground" />}
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
            ))}
          </div>
          {privateMediaCountText && (
            <p className="text-sm text-muted-foreground">
              {t('private_photos_access_count', { items: privateMediaCountText })}
            </p>
          )}
          <p className="text-sm text-amber-600 font-medium">{t('private_photos_access_pending')}</p>
        </div>
      );
    }

    if (status === 'denied') {
      return (
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('private_photos_access_declined')}</p>
          <Button size="sm" variant="outline" onClick={() => navigate(-1)}>{t('private_photos_send_message')}</Button>
        </div>
      );
    }

    // No record or revoked
    return (
      <div className="text-center py-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 mb-3 pointer-events-none select-none">
            {Array(Math.min(approvedPhotos.length || 3, 3)).fill(0).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted-foreground/15 border border-muted-foreground/20 flex flex-col items-center justify-center gap-1">
                {approvedPhotos[i]?.media_type === 'video' && <Video className="w-5 h-5 text-muted-foreground" />}
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
            ))}
          </div>
        {privateMediaCountText && (
          <p className="text-sm text-muted-foreground">
            {t('private_photos_access_count', { items: privateMediaCountText })}
          </p>
        )}
        {status === 'revoked' && (
          <p className="text-xs text-muted-foreground">{t('private_photos_access_revoked')}</p>
        )}
        <Button onClick={handleRequestAccess} disabled={requesting} className="gap-2">
          {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {t('private_photos_request_access')}
        </Button>
      </div>
    );
  };

  return (
    <>
      <VerificationRequiredModal
        open={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        onVerify={async () => {
          if (!myProfile?.id) throw new Error('Profile not found');
          const res = await base44.functions.invoke('createDiditSession', { memberId: myProfile.id });
          const result = res.data ?? res;
          if (!result?.url) throw new Error('Could not start verification. Please try again.');
          await base44.entities.MemberProfile.update(myProfile.id, {
            didit_session_id: result.session_id,
            didit_verification_status: 'pending',
          });
          window.location.href = result.url;
        }}
      />
      <Dialog open={!!confirmPhoto} onOpenChange={(v) => { if (!v) setConfirmPhoto(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock Private {confirmPhoto?.media_type === 'video' ? 'Video' : 'Photo'}</DialogTitle>
            <DialogDescription>Spend {confirmPhoto ? getViewCost(confirmPhoto) : 0} tokens to view this private {confirmPhoto?.media_type === 'video' ? 'video' : 'photo'}?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleConfirmPurchase} disabled={unlocking} className="w-full gap-2">
              {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirm ({confirmPhoto ? getViewCost(confirmPhoto) : 0} tokens)
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setConfirmPhoto(null)} disabled={unlocking}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PhotoZoomModal
        items={unlockedPhotos.map(p => ({ url: p.photo_url, type: p.media_type || 'image', poster: p.thumbnail_url }))}
        initialIndex={zoomIndex !== null ? unlockedPhotos.findIndex(p => p.id === approvedPhotos[zoomIndex]?.id) : 0}
        open={zoomIndex !== null}
        onOpenChange={(v) => { if (!v) setZoomIndex(null); }}
      />

      <Card className="mt-6">
        <CardHeader><CardTitle className="font-heading text-lg">{t('private_photos_and_videos_title')}</CardTitle></CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </>
  );
}