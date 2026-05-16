import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Users, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import useSiteConfig from '@/hooks/useSiteConfig';

const features = [
  { icon: Shield, title: 'ID Verified', desc: 'Every member is verified with government ID — no fakes, no bots.' },
  { icon: Users, title: 'Real People', desc: 'Maximum 3 photos and detailed bios encourage authentic connections.' },
  { icon: Heart, title: 'Genuine Matches', desc: 'Smart matching based on interests, location, and what you\'re looking for.' },
  { icon: Star, title: 'Safe & Secure', desc: 'End-to-end encryption, content moderation, and 24/7 support.' },
];

export default function Landing() {
  const { config } = useSiteConfig();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Shield className="w-4 h-4" />
              100% ID Verified Members
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {config.tagline || 'Where Real Connections Begin'}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {config.target_audience || 'Join a community of verified, authentic people looking for meaningful connections. No bots, no fakes — just real people.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="text-lg px-8 py-6 gap-2 rounded-full">
                  Start Browsing
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/my-profile">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full">
                  Complete Your Profile
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/40 rounded-full blur-3xl" />
      </section>

      {/* Features */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Why {config.site_name}?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We've built a platform where safety and authenticity come first.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Simple, Fair Pricing</h2>
            <p className="text-muted-foreground text-lg">Gender-balanced pricing that works for everyone.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Women */}
            <div className="bg-card border rounded-2xl p-8 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                For Women
              </div>
              <div className="font-heading text-5xl font-bold mb-2">Free</div>
              <p className="text-muted-foreground mb-6">Always free, full access</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Full profile access</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Unlimited messaging</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Browse & search</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> ID verification</li>
              </ul>
              <Link to="/my-profile">
                <Button className="w-full rounded-full" size="lg">Get Started</Button>
              </Link>
            </div>
            {/* Men */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                {config.trial_duration_months} Months Free
              </div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4 mt-2">
                For Men
              </div>
              <div className="font-heading text-5xl font-bold mb-2">${config.subscription_price}<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-muted-foreground mb-6">After {config.trial_duration_months}-month free trial</p>
              <ul className="text-sm text-left space-y-3 mb-8">
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Full profile access</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Unlimited messaging</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> Browse & search</li>
                <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-primary" /> ID verification</li>
              </ul>
              <Link to="/my-profile">
                <Button className="w-full rounded-full" size="lg">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {config.logo_url ? (
                <img src={config.logo_url} alt={config.site_name} className="h-6 w-auto" />
              ) : (
                <Heart className="w-5 h-5 text-primary fill-primary" />
              )}
              <span className="font-heading font-semibold">{config.site_name}</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link to="/support" className="hover:text-foreground transition-colors">Support</Link>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {config.site_name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}