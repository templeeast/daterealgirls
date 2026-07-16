import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift, ShieldCheck, UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useMyProfile from '@/hooks/useMyProfile';

/**
 * Shown on the landing page in place of the scrolling profiles banner when
 * the site hasn't reached the configured minimum member count yet.
 * Promotes the FIRST500 promo code — 3,000 free tokens for the first 500
 * verified members.
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

  const steps = [
    {
      icon: UserPlus,
      title: 'Create a Profile',
      desc: 'Sign up and build your member profile with photos and a bio.',
    },
    {
      icon: ShieldCheck,
      title: 'Complete ID Verification',
      desc: 'Verify your identity with our secure government ID check.',
    },
    {
      icon: Gift,
      title: 'Claim 3,000 Tokens',
      desc: 'Enter promo code FIRST500 after verification to receive your bonus.',
    },
  ];

  return (
    <section className="py-14 bg-gradient-to-b from-accent/40 to-background border-y border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            New Site Launch Special
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-3">
            Get <span className="text-primary">3,000 Free Tokens</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            We're a brand-new community! Be one of the first 500 members to join,
            create a profile, and complete ID verification to claim your bonus with
            promo code{' '}
            <span className="font-mono font-bold text-primary">FIRST500</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="bg-card border rounded-2xl p-5 relative"
            >
              <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/50">
                {i + 1}
              </span>
              <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="text-lg px-8 py-6 rounded-full gap-2"
            onClick={handleCTA}
          >
            <Gift className="w-5 h-5" />
            {isAuthenticated ? 'Get Started' : 'Sign Up Now'}
          </Button>
          <p className="text-xs text-muted-foreground text-center max-w-md">
            Limited to the first 500 verified members. Promo code{' '}
            <span className="font-mono font-bold text-primary">FIRST500</span> must be
            entered manually after ID verification. Profile creation and verification required.
          </p>
        </div>
      </div>
    </section>
  );
}