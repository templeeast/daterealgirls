import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import VerificationRequiredModal from '@/components/shared/VerificationRequiredModal';
import { useNavigate } from 'react-router-dom';

const requiresIdVerification = (p) => p?.didit_verification_status === 'Approved';

export default function PrivatePhotosSection({ profile, onRefetch }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showVerifModal, setShowVerifModal] = useState(false);

  const { data: privatePhotos = [], refetch } = useQuery({
    queryKey: ['privatePhotos', profile.id],
    queryFn: () => base44.entities.PrivatePhoto.filter({ member_id: profile.id }, '-uploaded_at'),
    enabled: !!profile.id,
  });

  const isMale = profile.gender === 'male';
  const uploadCost = isMale ? 10 : 0;

  const handleUploadClick = () => {
    setUploadError('');
    if (!requiresIdVerification(profile)) {
      setShowVerifModal(true);
      return;
    }
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

    // 10-photo limit (count non-rejected)
    const nonRejected = privatePhotos.filter(p => p.status !== 'rejected');
    if (nonRejected.length >= 10) {
      setUploadError("You've reached the maximum of 10 private photos. Delete an existing private photo to upload a new one.");
      return;
    }

    setUploading(true);
    setUploadError('');

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await base44.functions.invoke('uploadToCloudinary', { file: base64, filename: file.name });
      const imageUrl = res.data?.url;
      if (!imageUrl) {
        setUploadError('Upload failed. Please try again.');
        setUploading(false);
        return;
      }

      const tokenCostToView = isMale ? 5 : 0;

      // Deduct upload cost for men
      if (isMale && uploadCost > 0) {
        await base44.entities.MemberProfile.update(profile.id, {
          tokens: Math.max(0, (profile.tokens || 0) - uploadCost),
        });
        await base44.entities.TokenTransaction.create({
          user_id: profile.user_id,
          type: 'spend',
          tokens: -uploadCost,
          description: 'Private photo upload fee',
        });
      }

      // Create PrivatePhoto record
      await base44.entities.PrivatePhoto.create({
        member_id: profile.id,
        photo_url: imageUrl,
        status: 'pending_review',
        token_cost_to_view: tokenCostToView,
        uploaded_at: new Date().toISOString(),
      });

      // Submit to content review pipeline
      await base44.entities.PhotoReview.create({
        photo_url: imageUrl,
        source_type: 'private',
        source_description: `Private photo of ${profile.display_name || 'Unknown'}`,
        source_profile_id: profile.id,
        source_user_id: profile.user_id,
        source_field: 'private_photo',
        review_status: 'pending',
      });

      toast({ title: 'Your private photo has been submitted for review and will be visible once approved.' });
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

  const displayPhotos = privatePhotos.filter(p => p.status !== 'rejected');

  return (
    <>
      <VerificationRequiredModal
        open={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        onVerify={() => navigate('/onboarding')}
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            🔒 Private Photos
          </CardTitle>
          <CardDescription>
            Private photos are only visible to verified members. Men pay 5 tokens to view each one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {uploadError && (
            <div className="mb-3 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {uploadError}
              {uploadError.includes('tokens') && (
                <button className="ml-2 underline text-primary" onClick={() => document.getElementById('buy-tokens')?.scrollIntoView({ behavior: 'smooth' })}>
                  Get Tokens →
                </button>
              )}
            </div>
          )}

          <Button
            variant="outline"
            className="gap-2 mb-4"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : `Upload Private Photo${isMale ? ' (10 tokens)' : ''}`}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {displayPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {displayPhotos.map(photo => (
                <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border">
                  <img src={photo.photo_url} alt="" className={`w-full h-full object-cover ${photo.status === 'pending_review' ? 'opacity-50' : ''}`} />
                  {photo.status === 'pending_review' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white text-xs font-medium text-center px-1">⏳ Under Review</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(photo)}
                    className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-black/60 text-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}