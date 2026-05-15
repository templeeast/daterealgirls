import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useMyProfile() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const me = await base44.auth.me();
      const profiles = await base44.entities.MemberProfile.filter({ user_id: me.id });
      return { user: me, profile: profiles.length > 0 ? profiles[0] : null };
    },
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    refetch,
  };
}