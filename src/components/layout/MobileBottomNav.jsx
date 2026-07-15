import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Hand, MessageCircle, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Fixed bottom navigation bar for mobile devices.
 * Shows the four primary tabs: Discover, Winks, Messages, Profile.
 * Hidden on desktop (md:hidden) — desktop keeps the top navbar.
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const { profile } = useMyProfile();
  const { t } = useTranslation();

  const profileComplete = profile?.profile_complete && (
    profile?.selfie_url ||
    profile?.didit_verification_status === 'Approved' ||
    profile?.verification_status === 'verified'
  );

  const { data: winks } = useQuery({
    queryKey: ['winks-count', profile?.id],
    queryFn: () => base44.entities.Wink.filter({ recipient_profile_id: profile.id }),
    enabled: !!profile?.id,
  });
  const winksCount = winks?.length ?? 0;

  const items = [
    {
      path: '/browse',
      label: t('nav_browse', 'Discover'),
      icon: Sparkles,
      restricted: true,
      needsVerification: false,
    },
    {
      path: '/winks',
      label: t('nav_winks', 'Winks'),
      icon: Hand,
      restricted: true,
      needsVerification: true,
      badge: winksCount,
    },
    {
      path: '/messages',
      label: t('nav_messages', 'Messages'),
      icon: MessageCircle,
      restricted: true,
      needsVerification: true,
    },
    {
      path: '/my-profile',
      label: t('nav_profile', 'Profile'),
      icon: User,
      restricted: false,
    },
  ];

  const isActive = (path) => {
    if (path === '/browse') {
      return location.pathname === '/browse' || location.pathname.startsWith('/profile/');
    }
    return location.pathname === path;
  };

  const isDisabled = (item) => {
    return item.restricted && (item.needsVerification ? !profileComplete : !profile?.profile_complete);
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card/95 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ path, label, icon: Icon, badge }) => {
          const active = isActive(path);
          const disabled = isDisabled({ path, restricted: true, needsVerification: path === '/winks' || path === '/messages' });
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              } ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}