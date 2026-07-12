import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, User, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import StickyAdBar from '@/components/shared/StickyAdBar';
import HilltopAdBar from '@/components/shared/HilltopAdBar';
import { useTranslation } from 'react-i18next';

export default function Favorites() {
  const { user } = useMyProfile();
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const queryClient = useQueryClient();

  const { data: rawFavorites, isLoading } = useQuery({
    queryKey: ['myFavorites', user?.id],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: [],
  });

  // Deduplicate by favorited_profile_id — keep only the first occurrence
  const seen = new Set();
  const favorites = rawFavorites.filter(fav => {
    if (seen.has(fav.favorited_profile_id)) return false;
    seen.add(fav.favorited_profile_id);
    return true;
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myFavorites'] }),
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Sticky ad bar — JuicyAds, stays visible while scrolling */}
      <StickyAdBar
        zone={config?.juicyads_zone_favorites}
        zoneMobile={config?.juicyads_zone_favorites_mobile}
      />

      {/* Sticky ad bar — HilltopAds 300×250 */}
      <HilltopAdBar scriptUrl={config?.hilltopads_zone_winks_messages_favorites} scriptUrlMobile={config?.hilltopads_zone_winks_messages_favorites_mobile} />

      <h1 className="font-heading text-3xl font-bold mb-6">{t('favorites_title')}</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t('favorites_empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('favorites_empty_sub')}
          </p>
          <Link to="/browse">
            <Button className="mt-4 rounded-full">{t('browse_profiles_btn')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map(fav => (
            <div key={fav.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border hover:shadow-sm transition-shadow">
              <Link to={`/profile/${fav.favorited_profile_id}`} className="flex items-center gap-4 flex-1 min-w-0">
                {fav.favorited_user_photo ? (
                  <img src={fav.favorited_user_photo} className="w-14 h-14 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{fav.favorited_user_name || 'User'}</h3>
                  <p className="text-sm text-muted-foreground">{t('view_profile')}</p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeMutation.mutate(fav.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}