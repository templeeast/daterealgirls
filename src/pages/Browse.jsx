import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, Coins, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProfileCard from '@/components/browse/ProfileCard';
import BrowseAllDialog from '@/components/browse/BrowseAllDialog';
import useMyProfile from '@/hooks/useMyProfile';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from 'react-i18next';
import useSiteConfig from '@/hooks/useSiteConfig';
import CountryCitySelector from '@/components/shared/CountryCitySelector';
import StickyAdBar from '@/components/shared/StickyAdBar';
import HilltopAdBar from '@/components/shared/HilltopAdBar';
import { getCountryCode, haversineDistance } from '@/lib/geoUtils';

export default function Browse() {
  const navigate = useNavigate();
  const { user, profile, refetch } = useMyProfile();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const queryClient = useQueryClient();

  // Token-based browse gating
  const isMale = profile?.gender === 'male';
  const browseEnabled = isMale ? (config?.tokens_browse_men_enabled !== false) : (config?.tokens_browse_women_enabled || false);
  const browseLimit = config?.tokens_free_browse_limit ?? 25;
  const browseCost = isMale ? (config?.tokens_browse_cost_men ?? 100) : (config?.tokens_browse_cost_women ?? 0);
  const currentTokens = profile?.tokens ?? 0;

  // Check browse week window
  const browseWeekStart = profile?.browse_week_start ? new Date(profile.browse_week_start) : null;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const needsWeekReset = !browseWeekStart || browseWeekStart < weekAgo;
  const effectiveBrowseCount = needsWeekReset ? 0 : (profile?.browse_count_this_week ?? 0);
  const isPastFreeLimit = effectiveBrowseCount >= browseLimit;

  // Unverified users are limited to the free browse limit, same as token-gated users
  const isVerified = profile?.verification_status === 'verified';
  const isUnverifiedGate = !isVerified;

  // Browse-all unlock: user paid browseCost tokens for 7 days of unlimited browsing
  const browseUnlockedUntil = profile?.browse_unlocked_until ? new Date(profile.browse_unlocked_until) : null;
  const isBrowseUnlocked = browseUnlockedUntil && browseUnlockedUntil > new Date();

  // Can interact (message/wink/favorite) only if verified AND has purchased browse-all
  const canInteract = isVerified && !!isBrowseUnlocked;

  const shouldGateBrowsing = isUnverifiedGate || (browseEnabled && isPastFreeLimit && !isBrowseUnlocked);

  // Browse-all purchase dialog
  const [browseAllDialogOpen, setBrowseAllDialogOpen] = useState(false);

  // Persist filters in sessionStorage so they survive navigation
  const loadFilter = (key, fallback) => {
    try { const v = sessionStorage.getItem('browse_' + key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  const saveFilter = (key, value) => { try { sessionStorage.setItem('browse_' + key, JSON.stringify(value)); } catch {} };

  const [search, setSearch] = useState(() => loadFilter('search', ''));
  const [genderFilter, setGenderFilter] = useState(() => loadFilter('gender', 'all'));
  const [lookingForFilter, setLookingForFilter] = useState(() => loadFilter('lookingFor', 'all'));
  const [ageMin, setAgeMin] = useState(() => loadFilter('ageMin', ''));
  const [ageMax, setAgeMax] = useState(() => loadFilter('ageMax', ''));
  const [showFilters, setShowFilters] = useState(() => loadFilter('showFilters', false));
  const [countryFilter, setCountryFilter] = useState(() => loadFilter('country', ''));
  const [cityFilter, setCityFilter] = useState(() => loadFilter('city', ''));
  const [zipSearch, setZipSearch] = useState(() => loadFilter('zipSearch', ''));
  const [radiusSearch, setRadiusSearch] = useState(() => loadFilter('radiusSearch', 25));
  const [zipCoords, setZipCoords] = useState(null);
  const [zipSearching, setZipSearching] = useState(false);
  const [zipError, setZipError] = useState('');

  const handleSearch = v => { setSearch(v); saveFilter('search', v); };
  const handleGender = v => { setGenderFilter(v); saveFilter('gender', v); };
  const handleLookingFor = v => { setLookingForFilter(v); saveFilter('lookingFor', v); };
  const handleAgeMin = v => { setAgeMin(v); saveFilter('ageMin', v); };
  const handleAgeMax = v => { setAgeMax(v); saveFilter('ageMax', v); };
  const handleShowFilters = v => {
    setShowFilters(v);
    saveFilter('showFilters', v);
    if (!v) {
      // Closing filters — reset all filter values
      setGenderFilter('all'); saveFilter('gender', 'all');
      setLookingForFilter('all'); saveFilter('lookingFor', 'all');
      setAgeMin(''); saveFilter('ageMin', '');
      setAgeMax(''); saveFilter('ageMax', '');
      setCountryFilter(''); saveFilter('country', '');
      setCityFilter(''); saveFilter('city', '');
      setZipSearch(''); saveFilter('zipSearch', '');
      setRadiusSearch(25); saveFilter('radiusSearch', 25);
      setZipCoords(null);
      setZipError('');
    }
  };
  const handleCountry = v => { setCountryFilter(v); setCityFilter(''); saveFilter('country', v); saveFilter('city', ''); };
  const handleCity = v => { setCityFilter(v); saveFilter('city', v); };
  const handleZipSearch = v => { setZipSearch(v); saveFilter('zipSearch', v); };
  const handleRadiusSearch = v => { setRadiusSearch(v); saveFilter('radiusSearch', v); };

  // Debounced zip geocoding for radius search
  useEffect(() => {
    if (!zipSearch || zipSearch.length < 3) {
      setZipCoords(null);
      setZipError('');
      setZipSearching(false);
      return;
    }
    const countryCode = getCountryCode(countryFilter || profile?.location_country);
    if (!countryCode) {
      setZipError(t('browse_zip_country_required'));
      setZipCoords(null);
      setZipSearching(false);
      return;
    }
    setZipSearching(true);
    setZipError('');
    const timer = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke('geocodeZip', { zip: zipSearch, country_code: countryCode });
        if (res.data?.latitude != null) {
          setZipCoords({ lat: res.data.latitude, lng: res.data.longitude });
          setZipError('');
        } else {
          setZipCoords(null);
          setZipError(t('browse_zip_not_found'));
        }
      } catch (e) {
        setZipCoords(null);
        setZipError(t('browse_zip_not_found'));
      } finally {
        setZipSearching(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [zipSearch, countryFilter, profile?.location_country, t]);

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

  const { data: myWinks } = useQuery({
    queryKey: ['myWinks', user?.id],
    queryFn: () => user ? base44.entities.Wink.filter({ sender_id: user.id }) : [],
    enabled: !!user,
    initialData: [],
  });
  const winkedIds = new Set(myWinks.map(w => w.recipient_profile_id));

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
    if (p.verification_status === 'rejected' || p.profile_review_status === 'rejected') return false;
    if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
    if (lookingForFilter !== 'all' && p.looking_for !== lookingForFilter) return false;
    if (ageMin !== '' && (p.age == null || p.age < parseInt(ageMin))) return false;
    if (ageMax !== '' && (p.age == null || p.age > parseInt(ageMax))) return false;
    if (countryFilter && p.location_country !== countryFilter) return false;
    if (cityFilter && p.location_city !== cityFilter) return false;
    if (zipCoords) {
      if (p.latitude == null || p.longitude == null) return false;
      const dist = haversineDistance(zipCoords.lat, zipCoords.lng, p.latitude, p.longitude);
      if (dist > radiusSearch) return false;
    }
    if (search) {
      const s = search.toLowerCase();
      return (
        p.display_name?.toLowerCase().includes(s) ||
        p.location_city?.toLowerCase().includes(s) ||
        p.location_country?.toLowerCase().includes(s) ||
        p.bio?.toLowerCase().includes(s) ||
        p.tag_id?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const gateVisibleCount = isUnverifiedGate
    ? browseLimit
    : Math.max(0, browseLimit - effectiveBrowseCount);
  const visibleProfiles = shouldGateBrowsing ? filtered.slice(0, gateVisibleCount) : filtered;
  const hasLockedProfiles = shouldGateBrowsing && filtered.length > gateVisibleCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sticky ad bar — JuicyAds, stays visible while scrolling */}
      <StickyAdBar
        zone={config?.juicyads_zone_browse}
        zoneMobile={config?.juicyads_zone_browse_mobile}
      />

      {/* Sticky ad bar — HilltopAds 300×250 */}
      <HilltopAdBar scriptUrl={config?.hilltopads_zone_browse_profile} />

      {/* Token balance banner */}
      {currentTokens < 200 && !isUnverifiedGate && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">Running low on tokens — Top up now!</p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300" onClick={() => navigate('/my-profile')}>Buy Tokens</Button>
        </div>
      )}

      {/* Verification required banner — unverified users see limited profiles */}
      {isUnverifiedGate && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800">{t('browse_verify_to_unlock_desc')}</p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => navigate('/my-profile')}>
            <Shield className="w-4 h-4" /> {t('browse_verify_to_unlock_button')}
          </Button>
        </div>
      )}

      {/* Browse-all unlock banner — verified but not yet unlocked */}
      {isVerified && !isBrowseUnlocked && (
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">{t('browse_all_banner_desc', { cost: browseCost })}</p>
          </div>
          <Button size="sm" className="shrink-0 gap-2" onClick={() => setBrowseAllDialogOpen(true)}>
            <Coins className="w-4 h-4" /> {t('browse_all_banner_btn')}
          </Button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-6">{t('browse_title')}</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, country, tag (@DRG-)..."
              className="pl-10"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 sm:w-auto w-full"
            onClick={() => handleShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('browse_filters')}
          </Button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-4 p-4 bg-card rounded-xl border">
            <Select value={genderFilter} onValueChange={handleGender}>
              <SelectTrigger className="w-40"><SelectValue placeholder={t('browse_gender')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('browse_all_genders')}</SelectItem>
                <SelectItem value="female">{t('browse_women')}</SelectItem>
                <SelectItem value="male">{t('browse_men')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lookingForFilter} onValueChange={handleLookingFor}>
              <SelectTrigger className="w-44"><SelectValue placeholder={t('browse_looking_for')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('browse_all')}</SelectItem>
                <SelectItem value="relationship">{t('browse_relationship')}</SelectItem>
                <SelectItem value="friendship">{t('browse_friendship')}</SelectItem>
                <SelectItem value="casual">{t('browse_casual')}</SelectItem>
                <SelectItem value="marriage">{t('browse_marriage')}</SelectItem>
              </SelectContent>
            </Select>
            <CountryCitySelector
              country={countryFilter}
              city={cityFilter}
              onCountryChange={handleCountry}
              onCityChange={handleCity}
              showLabels={false}
            />
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('browse_zip_placeholder')}
                className="w-32"
                value={zipSearch}
                onChange={e => handleZipSearch(e.target.value)}
              />
              <Select value={String(radiusSearch)} onValueChange={v => handleRadiusSearch(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 {t('browse_radius_miles')}</SelectItem>
                  <SelectItem value="10">10 {t('browse_radius_miles')}</SelectItem>
                  <SelectItem value="25">25 {t('browse_radius_miles')}</SelectItem>
                  <SelectItem value="50">50 {t('browse_radius_miles')}</SelectItem>
                  <SelectItem value="100">100 {t('browse_radius_miles')}</SelectItem>
                  <SelectItem value="250">250 {t('browse_radius_miles')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {zipSearching && <p className="w-full text-xs text-muted-foreground">{t('browse_zip_geocoding')}</p>}
            {zipError && <p className="w-full text-xs text-destructive">{zipError}</p>}
            {zipCoords && !zipSearching && !zipError && (
              <p className="w-full text-xs text-green-600">{t('browse_within', { radius: radiusSearch, zip: zipSearch })}</p>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={t('browse_age_min')}
                className="w-24"
                value={ageMin}
                min={18}
                max={99}
                onChange={e => handleAgeMin(e.target.value)}
              />
              <span className="text-muted-foreground text-sm">–</span>
              <Input
                type="number"
                placeholder={t('browse_age_max')}
                className="w-24"
                value={ageMax}
                min={18}
                max={99}
                onChange={e => handleAgeMax(e.target.value)}
              />
            </div>
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
            {visibleProfiles.map((p, i) => (
              <React.Fragment key={p.id}>
                <ProfileCard
                  profile={p}
                  isFavorited={favoritedIds.has(p.id)}
                  onFavorite={() => favMutation.mutate(p)}
                  myProfile={profile}
                  hasWinked={winkedIds.has(p.id)}
                  canInteract={canInteract}
                  onLockedInteract={() => isUnverifiedGate ? navigate('/my-profile') : setBrowseAllDialogOpen(true)}
                />

              </React.Fragment>
            ))}
            {/* Blurred locked cards for token-gated or unverified browsing */}
            {shouldGateBrowsing && filtered.slice(gateVisibleCount).map((p, i) => (
              <div key={`locked-${i}`} className="relative rounded-2xl overflow-hidden border">
                <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-accent blur-sm scale-105" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <div className="bg-white/90 rounded-xl px-4 py-3 text-center shadow-lg">
                    {isUnverifiedGate ? (
                      <>
                        <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs font-semibold text-foreground">{t('browse_locked_verify')}</p>
                      </>
                    ) : (
                      <>
                        <Coins className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-xs font-semibold text-foreground">{t('browse_locked_unlock')}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasLockedProfiles && isUnverifiedGate && (
            <div className="mt-10 max-w-md mx-auto text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">{t('browse_verify_to_unlock_desc')}</p>
              <Button size="lg" className="rounded-full" onClick={() => navigate('/my-profile')}>
                <Shield className="w-4 h-4 mr-2" /> {t('browse_verify_to_unlock_button')}
              </Button>
            </div>
          )}
          {hasLockedProfiles && !isUnverifiedGate && (
            <div className="mt-10 max-w-md mx-auto text-center">
              <p className="text-muted-foreground mb-4">{t('browse_all_locked_desc')}</p>
              <Button size="lg" className="rounded-full gap-2" onClick={() => setBrowseAllDialogOpen(true)}>
                <Coins className="w-4 h-4" /> {t('browse_all_unlock_btn', { cost: browseCost })}
              </Button>
            </div>
          )}
        </>
      )}

      <BrowseAllDialog
        open={browseAllDialogOpen}
        onOpenChange={setBrowseAllDialogOpen}
        browseCost={browseCost}
        currentTokens={currentTokens}
        isVerified={isVerified}
        onSuccess={() => refetch()}
      />
    </div>
  );
}