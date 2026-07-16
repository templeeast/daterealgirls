import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Zap, MessageCircle, User, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Fixed bottom navigation bar for mobile only (md:hidden).
 * Shows the four primary destinations: Browse, Winks, Messages, Profile.
 * Does not interfere with top sticky ad bars or inline ad embeds.
 */
export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { user, profile } = useMyProfile();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const profileComplete = profile?.profile_complete && (
    profile?.selfie_url ||
    profile?.didit_verification_status === 'Approved' ||
    profile?.verification_status === 'verified'
  );

  const { data: winks } = useQuery({
    queryKey: ['winks-count-bottom', profile?.id],
    queryFn: () => base44.entities.Wink.filter({ recipient_profile_id: profile.id }),
    enabled: !!profile?.id,
  });
  const winksCount = winks?.length ?? 0;

  const items = [
    { path: '/browse', label: t('nav_browse', 'Browse'), icon: Search, restricted: true, needsVerification: false },
    { path: '/winks', label: t('nav_winks', 'Winks'), icon: Zap, restricted: true, needsVerification: true, badge: winksCount },
    { path: '/messages', label: t('nav_messages', 'Messages'), icon: MessageCircle, restricted: true, needsVerification: true },
    { path: '/favorites', label: t('nav_favorites', 'Favorites'), icon: Heart, restricted: true, needsVerification: true },
    { path: '/my-profile', label: t('nav_profile', 'Profile'), icon: User, restricted: false },
  ];

  const isDisabled = (item) =>
    item.restricted && (item.needsVerification ? !profileComplete : !profile?.profile_complete);

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t shadow-[0_-2px_8px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {items.map(({ path, label, icon: Icon, badge }) => {
          const active = location.pathname === path;
          const disabled = isDisabled({ path, restricted: true, needsVerification: false });
          const content = (
            <>
              <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
              {badge > 0 && (
                <span className="absolute top-0 right-1/4 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </>
          );

          return disabled ? (
            <div
              key={path}
              className="flex flex-col items-center justify-center gap-0.5 opacity-40 cursor-not-allowed flex-1 relative"
            >
              {content}
            </div>
          ) : (
            <Link
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 relative"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}