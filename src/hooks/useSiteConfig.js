import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const DEFAULT_CONFIG = {
  site_name: 'DateRealGirls.com',
  tagline: 'Where Real Connections Begin',
  subscription_price: 5,
  trial_duration_months: 3,
  max_photos: 3,
  bio_max_length: 500,
  logo_url: '',
  target_audience: 'Connect with verified, authentic people'
};

export default function useSiteConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: async () => {
      try {
        const configs = await base44.entities.SiteConfig.list();
        return configs.length > 0 ? { ...DEFAULT_CONFIG, ...configs[0] } : DEFAULT_CONFIG;
      } catch {
        return DEFAULT_CONFIG;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    config: data || DEFAULT_CONFIG,
    isLoading,
  };
}