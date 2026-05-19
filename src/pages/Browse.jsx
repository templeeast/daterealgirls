import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileCard from '@/components/browse/ProfileCard';
import useMyProfile from '@/hooks/useMyProfile';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import UpgradePrompt from '@/components/subscription/UpgradePrompt';
import useSiteConfig from '@/hooks/useSiteConfig';

export default function Browse() {
  const { user, profile } = useMyProfile();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const queryClient = useQueryClient();

  // Is this a free-tier male user?
  const isFreeMale = profile?.gender === 'male' && (!profile?.subscription_status || profile?.subscription_status === 'free');
  const browseLimit = config?.free_tier_browse_limit ?? 5;
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [lookingForFilter, setLookingForFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => base44.entities.MemberProfile.filter({ is_active: true, is_suspended: false, profile_complete: true }),
    initialData: [],
    enabled: isAuthenticated,
  });

  const { data: myFavorites } = useQuery({
    queryKey: ['myFavorites', user?.id],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_id: user.id }) : [],
    enabled: !!user,
    initialData: [],
  });

  const favMutation = useMutation({
    mutationFn: async (profile) => {
      const existing = myFavorites.find(f => f.favorited_profile_id === profile.id);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({
          user_id: user.id,
          favorited_profile_id: profile.id,
          favorited_user_name: profile.display_name,
          favorited_user_photo: profile.photo_1,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myFavorites'] }),
  });

  const favoritedIds = new Set(myFavorites.map(f => f.favorited_profile_id));

  const filtered = profiles.filter(p => {
    if (user && p.user_id === user.id) return false;
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
    if (lookingForFilter !== 'all' && p.looking_for !== lookingForFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.display_name?.toLowerCase().includes(s) ||
        p.location_city?.toLowerCase().includes(s) ||
        p.location_country?.toLowerCase().includes(s) ||
        p.bio?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const visibleProfiles = isFreeMale ? filtered.slice(0, browseLimit) : filtered;
  const hasLockedProfiles = isFreeMale && filtered.length > browseLimit;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Free tier banner for men */}
      {isFreeMale && (
        <div className="mb-6">
          <UpgradePrompt price={config?.subscription_price ?? 9.99} inline />
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-6">{t('browse_title')}</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('browse_search_placeholder')}
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 sm:w-auto w-full"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('browse_filters')}
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 p-4 bg-card rounded-xl border">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t('browse_gender')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('browse_all_genders')}</SelectItem>
                <SelectItem value="female">{t('browse_women')}</SelectItem>
                <SelectItem value="male">{t('browse_men')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lookingForFilter} onValueChange={setLookingForFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t('browse_looking_for')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('browse_all')}</SelectItem>
                <SelectItem value="relationship">{t('browse_relationship')}</SelectItem>
                <SelectItem value="friendship">{t('browse_friendship')}</SelectItem>
                <SelectItem value="casual">{t('browse_casual')}</SelectItem>
                <SelectItem value="marriage">{t('browse_marriage')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-12 mt-2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-lg">{t('browse_no_results')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleProfiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                isFavorited={favoritedIds.has(p.id)}
                onFavorite={() => favMutation.mutate(p)}
              />
            ))}
            {/* Blurred locked cards for free-tier males */}
            {isFreeMale && filtered.slice(browseLimit).map((p, i) => (
              <div key={`locked-${i}`} className="relative rounded-2xl overflow-hidden border">
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent blur-sm scale-105" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <div className="bg-white/90 rounded-xl px-4 py-3 text-center shadow-lg">
                    <p className="text-xs font-semibold text-foreground">🔒 Premium Only</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasLockedProfiles && (
            <div className="mt-10 max-w-md mx-auto">
              <UpgradePrompt price={config?.subscription_price ?? 9.99} />
            </div>
          )}
        </>
      )}
    </div>
  );
}