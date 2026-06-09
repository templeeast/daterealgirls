import React from 'react';
import { Crown, Lock, MessageCircle, Heart, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const BENEFITS = [
  { icon: Search, text: 'Browse unlimited profiles' },
  { icon: MessageCircle, text: 'Send & receive messages' },
  { icon: Heart, text: 'Save unlimited favorites' },
  { icon: Crown, text: 'Priority in search results' },
];

export default function UpgradePrompt({ price = 9.99, inline = false }) {
  const navigate = useNavigate();

  if (inline) {
    return (
      <div className="flex items-center gap-3 bg-accent/60 border border-primary/20 rounded-xl px-4 py-3">
        <Lock className="w-4 h-4 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1">
          Upgrade to <strong>Premium</strong> to unlock full messaging & browsing.
        </p>
        <Button size="sm" className="rounded-full gap-1 shrink-0" onClick={() => navigate('/my-profile#subscription')}>
          <Crown className="w-3 h-3" /> Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-2 border-primary/30 shadow-lg">
      <CardContent className="pt-8 pb-8 text-center">
        <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">Upgrade to Premium</h2>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Unlock unlimited browsing, messaging, and more for just ${price}/month.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8 max-w-xs mx-auto text-left">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-foreground">
              <Icon className="w-4 h-4 text-primary shrink-0" />
              {text}
            </div>
          ))}
        </div>
        <Button size="lg" className="rounded-full gap-2 px-8" onClick={() => navigate('/my-profile#subscription')}>
          <Crown className="w-4 h-4" /> Get Premium — ${price}/mo
        </Button>
        <p className="text-xs text-muted-foreground mt-3">Cancel anytime</p>
      </CardContent>
    </Card>
  );
}