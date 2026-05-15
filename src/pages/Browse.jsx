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

export default function Browse() {
  const { user } = useMyProfile();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [lookingForFilter, setLookingForFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => base44.entities.MemberProfile.filter({ is_active: true, is_suspended: false, profile_complete: true }),
    initialData: [],
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search & Filters */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Discover People</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, country..."
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
            Filters
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 p-4 bg-card rounded-xl border">
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="female">Women</SelectItem>
                <SelectItem value="male">Men</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lookingForFilter} onValueChange={setLookingForFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Looking for" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="relationship">Relationship</SelectItem>
                <SelectItem value="friendship">Friendship</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="marriage">Marriage</SelectItem>
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
          <p className="text-muted-foreground text-lg">No profiles found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isFavorited={favoritedIds.has(profile.id)}
              onFavorite={() => favMutation.mutate(profile)}
            />
          ))}
        </div>
      )}
    </div>
  );
}