import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Hand, MessageCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Fixed bottom navigation bar for mobile devices.
 * Shows the four primary tabs: Discover, Winks, Messages, Profile.
 * Hidden on desktop (md:hidden) — desktop keeps the top navbar.
 */
export default function MobileBottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  const items = [
    { path: '/browse', label: t('nav_browse', 'Discover'), icon: Sparkles },
    { path: '/winks', label: t('nav_winks', 'Winks'), icon: Hand },
    { path: '/messages', label: t('nav_messages', 'Messages'), icon: MessageCircle },
    { path: '/my-profile', label: t('nav_profile', 'Profile'), icon: User },
  ];

  const isActive = (path) => {
    if (path === '/browse') {
      return location.pathname === '/browse' || location.pathname.startsWith('/profile/');
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
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