import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';

export default function AuthorizeNetHostedButton({ price, hostedPageUrl }) {
  const handleClick = () => {
    if (hostedPageUrl) {
      window.open(hostedPageUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!hostedPageUrl) {
    return (
      <p className="text-sm text-destructive">
        Hosted payment page URL is not configured. Please set it in Admin → Site Settings.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full gap-2 rounded-full"
        size="lg"
        onClick={handleClick}
      >
        <CreditCard className="w-4 h-4" />
        Pay ${price}/month
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        You will be redirected to our secure payment page.
      </p>
    </div>
  );
}