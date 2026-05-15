import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Shield, Star, MessageCircle, Flag, Heart, ArrowLeft, Instagram, Facebook } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import { useToast } from '@/components/ui/use-toast';

export default function ViewProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = window.location.pathname.split('/profile/')[1];
  const navigate = useNavigate();
  const { user } = useMyProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', profileId],
    queryFn: async () => {
      const profiles = await base44.entities.MemberProfile.filter({ id: profileId });
      return profiles[0] || null;
    },
    enabled: !!profileId,
  });

  const { data: myFavorites } = useQuery({
    queryKey: ['myFavorites', user?.id],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: [],
  });

  const isFavorited = myFavorites.some(f => f.favorited_profile_id === profileId);

  const favMutation = useMutation({
    mutationFn: async () => {
      const existing = myFavorites.find(f => f.favorited_profile_id === profileId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({
          user_id: user.id,
          favorited_profile_id: profileId,
          favorited_user_name: profile.display_name,
          favorited_user_photo: profile.photo_1,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myFavorites'] }),
  });

  const handleMessage = async () => {
    // Check if conversation already exists
    const convos1 = await base44.entities.Conversation.filter({ participant_1_id: user.id, participant_2_id: profile.user_id });
    const convos2 = await base44.entities.Conversation.filter({ participant_1_id: profile.user_id, participant_2_id: user.id });
    const existing = [...convos1, ...convos2][0];

    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
      const convo = await base44.entities.Conversation.create({
        participant_1_id: user.id,
        participant_2_id: profile.user_id,
        participant_1_name: myProfile?.display_name || 'User',
        participant_2_name: profile.display_name,
        participant_1_photo: myProfile?.photo_1 || '',
        participant_2_photo: profile.photo_1 || '',
      });
      navigate(`/chat/${convo.id}`);
    }
  };

  const handleReport = async () => {
    navigate(`/report/${profileId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Skeleton className="h-96 rounded-2xl mb-6" />
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">Profile not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/browse')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Browse
        </Button>
      </div>
    );
  }

  const photos = [profile.photo_1, profile.photo_2, profile.photo_3].filter(Boolean);
  const lookingForLabels = { relationship: 'Relationship', friendship: 'Friendship', casual: 'Casual', marriage: 'Marriage' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Photos */}
      {photos.length > 0 ? (
        <div className={`grid gap-3 mb-6 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {photos.map((url, i) => (
            <div key={i} className={`rounded-2xl overflow-hidden ${i === 0 && photos.length > 1 ? 'col-span-2 row-span-2' : ''}`}>
              <img src={url} alt="" className="w-full h-full object-cover aspect-square" />
            </div>
          ))}
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent rounded-2xl flex items-center justify-center mb-6">
          <Heart className="w-16 h-16 text-primary/20" />
        </div>
      )}

      {/* Info */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-3xl font-bold">{profile.display_name}, {profile.age}</h1>
            {profile.verification_status === 'verified' && (
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                <Shield className="w-3 h-3" /> Verified
              </Badge>
            )}
          </div>
          {(profile.location_city || profile.location_country) && (
            <p className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              {[profile.location_city, profile.location_country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <Button className="gap-2 rounded-full" onClick={handleMessage}>
          <MessageCircle className="w-4 h-4" /> Message
        </Button>
        <Button variant="outline" className="gap-2 rounded-full" onClick={() => favMutation.mutate()}>
          <Star className={`w-4 h-4 ${isFavorited ? 'fill-primary text-primary' : ''}`} />
          {isFavorited ? 'Favorited' : 'Favorite'}
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground" onClick={handleReport}>
          <Flag className="w-4 h-4" />
        </Button>
      </div>

      {/* Bio */}
      {profile.bio && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-semibold mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-heading text-lg font-semibold mb-3">Details</h3>
          <div className="grid grid-cols-2 gap-4">
            {profile.looking_for && (
              <div>
                <p className="text-sm text-muted-foreground">Looking for</p>
                <p className="font-medium">{lookingForLabels[profile.looking_for]}</p>
              </div>
            )}
            {profile.interests?.length > 0 && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map(i => (
                    <Badge key={i} variant="secondary">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      {(profile.instagram || profile.facebook || profile.tiktok) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg font-semibold mb-3">Social Media</h3>
            <div className="flex gap-3">
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                    <Instagram className="w-3 h-3" /> {profile.instagram}
                  </Badge>
                </a>
              )}
              {profile.facebook && (
                <a href={profile.facebook} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-muted">
                    <Facebook className="w-3 h-3" /> Facebook
                  </Badge>
                </a>
              )}
              {profile.tiktok && (
                <Badge variant="outline" className="gap-1">TikTok: {profile.tiktok}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}