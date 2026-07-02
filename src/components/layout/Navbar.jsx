import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, Search, Menu, X, Star, Shield, LogOut, Settings, Coins, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import { base44 } from '@/api/base44Client';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import LanguageSelector from '@/components/layout/LanguageSelector';

export default function Navbar() {
  const { config } = useSiteConfig();
  const { user, profile } = useMyProfile();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const isAdmin = user?.role === 'admin';
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

  const navItems = [
    { path: '/browse', label: t('nav_browse'), icon: Search, restricted: true },
    { path: '/winks', label: t('nav_winks', 'Winks'), icon: Zap, restricted: true, badge: winksCount },
    { path: '/messages', label: t('nav_messages'), icon: MessageCircle, restricted: true },
    { path: '/favorites', label: t('nav_favorites'), icon: Star, restricted: true },
    { path: '/my-profile', label: t('nav_profile'), icon: User, restricted: false },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {config.logo_url ? (
              <img src={config.logo_url} alt={config.site_name} className="h-8 w-auto" />
            ) : (
              <Heart className="w-7 h-7 text-primary fill-primary" />
            )}
            <span className="font-heading text-lg font-semibold hidden sm:block">
              {config.site_name}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon, restricted, badge }) => {
              const disabled = restricted && !profileComplete;
              return disabled ? (
                <Button key={path} variant="ghost" size="sm" className="gap-2 opacity-40 cursor-not-allowed" disabled>
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ) : (
                <Link key={path} to={path} className="relative">
                  <Button
                    variant={location.pathname === path ? 'default' : 'ghost'}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Token Balance */}
            <div className="hidden sm:flex items-center gap-1.5 bg-accent text-accent-foreground px-2.5 py-1 rounded-full text-sm font-medium">
              <Coins className="w-3.5 h-3.5 text-primary" />
              <span>{(profile?.tokens ?? 0).toLocaleString()}</span>
            </div>
            {profile?.verification_status === 'verified' && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-primary bg-accent px-2 py-1 rounded-full">
                <Shield className="w-3 h-3" />
                {t('verified_badge')}
              </div>
            )}
            <LanguageSelector />
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={() => base44.auth.logout('/')}
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-2 mt-8">
                  {profile && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
                      {profile.photo_1 ? (
                        <img src={profile.photo_1} className="w-10 h-10 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{profile.display_name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                  )}
                  {navItems.map(({ path, label, icon: Icon, restricted, badge }) => {
                    const disabled = restricted && !profileComplete;
                    return disabled ? (
                      <Button key={path} variant="ghost" className="w-full justify-start gap-3 opacity-40 cursor-not-allowed" disabled>
                        <Icon className="w-4 h-4" />
                        {label}
                      </Button>
                    ) : (
                      <Link key={path} to={path} onClick={() => setOpen(false)} className="relative">
                        <Button
                          variant={location.pathname === path ? 'default' : 'ghost'}
                          className="w-full justify-start gap-3"
                        >
                          <Icon className="w-4 h-4" />
                          {label}
                          {badge > 0 && (
                            <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                  <Link to="/support" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-3">
                      <Settings className="w-4 h-4" />
                      {t('nav_support')}
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-3">
                        <Shield className="w-4 h-4" />
                        {t('nav_admin')}
                      </Button>
                    </Link>
                  )}
                  <div className="border-t my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-destructive"
                    onClick={() => base44.auth.logout('/')}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav_logout')}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}