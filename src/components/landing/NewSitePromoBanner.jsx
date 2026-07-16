import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Compact promotional banner shown in place of the scrolling profiles banner
 * when the site hasn't reached the configured minimum member count yet.
 * Promotes the FIRST500 promo code — 3,000 free tokens for the first 500
 * verified members. Matches the height/spacing of the scrolling banner.
 */
export default function NewSitePromoBanner() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const { profile } = useMyProfile();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (!isAuthenticated) {
      navigateToLogin();
      return;
    }
    if (!profile || !profile.profile_complete) {
      navigate('/onboarding');
    } else {
      navigate('/my-profile');
    }
  };

  return (
    <section className="py-2 bg-secondary/30 overflow-hidden border-y border-border">
      <div className="flex items-center gap-4 px-4 sm:px-6 max-w-6xl mx-auto min-h-[192px] sm:min-h-[240px]">
        <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/15">
          <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            New Site Launch Special
          </span>
          <p className="text-lg sm:text-xl font-heading font-bold text-foreground mt-0.5">
            Get <span className="text-primary">3,000 free tokens</span> with code{' '}
            <span className="font-mono text-primary">FIRST500</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
            Create a profile, complete ID verification, and be one of the first 500
            members to claim your bonus.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
            Verify your ID &amp; be one of the first 500 members.
          </p>
        </div>
        <Button
          className="flex-shrink-0 gap-1.5 rounded-full"
          onClick={handleCTA}
        >
          <Gift className="w-4 h-4" />
          <span className="hidden sm:inline">{isAuthenticated ? 'Get Started' : 'Sign Up'}</span>
          <span className="sm:hidden">{isAuthenticated ? 'Start' : 'Join'}</span>
        </Button>
      </div>
    </section>
  );
}