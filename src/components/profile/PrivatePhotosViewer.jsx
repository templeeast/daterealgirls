import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import VerificationRequiredModal from '@/components/shared/VerificationRequiredModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const requiresIdVerification = (p) => p?.didit_verification_status === 'Approved';

export default function PrivatePhotosViewer({ ownerProfileId, myProfile }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showVerifModal, setShowVerifModal] = useState(false);
  const [confirmPhoto, setConfirmPhoto] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState(new Set());

  const { data: photos = [] } = useQuery({
    queryKey: ['privatePhotos', ownerProfileId],
    queryFn: () => base44.entities.PrivatePhoto.filter({ member_id: ownerProfileId }),
    enabled: !!ownerProfileId,
  });

  const { data: myViews = [] } = useQuery({
    queryKey: ['myPrivatePhotoViews', myProfile?.id],
    queryFn: () => base44.entities.PrivatePhotoView.filter({ viewer_member_id: myProfile.id }),
    enabled: !!myProfile?.id,
  });

  const approvedPhotos = photos.filter(p => p.status === 'approved');
  if (approvedPhotos.length === 0) return null;

  const isViewerMale = myProfile?.gender === 'male';
  const viewCost = isViewerMale ? 5 : 0;
  const paidViewSet = new Set(myViews.map(v => v.private_photo_id));

  const isUnlocked = (photo) => paidViewSet.has(photo.id) || unlockedIds.has(photo.id);

  // Not verified at all — show gate message
  if (!requiresIdVerification(myProfile)) {
    return (
      <>
        <VerificationRequiredModal
          open={showVerifModal}
          onClose={() => setShowVerifModal(false)}
          onVerify={() => navigate('/onboarding')}
        />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-heading text-lg">🔒 Private Photos</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-6">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Verify your identity to view private photos.</p>
            <Button onClick={() => setShowVerifModal(true)}>Verify Now →</Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const handlePhotoClick = async (photo) => {
    if (isUnlocked(photo)) return;

    if (!requiresIdVerification(myProfile)) {
      setShowVerifModal(true);
      return;
    }

    if (!isViewerMale) {
      // Free for women — record view and unlock immediately
      await base44.entities.PrivatePhotoView.create({
        private_photo_id: photo.id,
        viewer_member_id: myProfile.id,
        viewed_at: new Date().toISOString(),
        tokens_spent: 0,
      });
      setUnlockedIds(prev => new Set([...prev, photo.id]));
      return;
    }

    // Male — show confirm dialog
    setConfirmPhoto(photo);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmPhoto) return;
    setUnlocking(true);

    if ((myProfile.tokens || 0) < 5) {
      toast({ title: 'You need 5 tokens to view this photo.', variant: 'destructive' });
      setUnlocking(false);
      setConfirmPhoto(null);
      return;
    }

    await base44.entities.MemberProfile.update(myProfile.id, {
      tokens: Math.max(0, (myProfile.tokens || 0) - 5),
    });
    await base44.entities.TokenTransaction.create({
      user_id: myProfile.user_id,
      type: 'spend',
      tokens: -5,
      description: 'Private photo view fee',
    });
    await base44.entities.PrivatePhotoView.create({
      private_photo_id: confirmPhoto.id,
      viewer_member_id: myProfile.id,
      viewed_at: new Date().toISOString(),
      tokens_spent: 5,
    });

    setUnlockedIds(prev => new Set([...prev, confirmPhoto.id]));
    setConfirmPhoto(null);
    setUnlocking(false);
  };

  return (
    <>
      <VerificationRequiredModal
        open={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        onVerify={() => navigate('/onboarding')}
      />

      <Dialog open={!!confirmPhoto} onOpenChange={(v) => { if (!v) setConfirmPhoto(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unlock Private Photo</DialogTitle>
            <DialogDescription>Spend 5 tokens to view this private photo?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handleConfirmPurchase} disabled={unlocking} className="w-full gap-2">
              {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Confirm (5 tokens)
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setConfirmPhoto(null)} disabled={unlocking}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg">🔒 Private Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {approvedPhotos.map(photo => {
              const unlocked = isUnlocked(photo);
              return (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-xl overflow-hidden border cursor-pointer"
                  onClick={() => handlePhotoClick(photo)}
                >
                  <img
                    src={photo.photo_url}
                    alt=""
                    className={`w-full h-full object-cover transition-all ${unlocked ? '' : 'blur-xl scale-110'}`}
                  />
                  {!unlocked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                      <Lock className="w-6 h-6 text-white mb-1" />
                      <span className="text-white text-xs font-medium">
                        {isViewerMale ? '🔒 5 tokens to unlock' : 'Tap to view'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}