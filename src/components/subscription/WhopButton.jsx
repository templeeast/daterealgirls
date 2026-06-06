import React from 'react';
import { Button } from '@/components/ui/button';

export default function WhopButton({ planId, prefillEmail, returnUrl, devMode }) {
  const handleClick = () => {
    if (!planId) {
      alert('Whop plan ID not configured. Please contact support.');
      return;
    }
    const params = new URLSearchParams();
    if (prefillEmail) params.set('prefilled_email', prefillEmail);
    if (returnUrl) params.set('redirect_uri', returnUrl);
    const baseUrl = devMode ? 'https://sandbox.whop.com' : 'https://whop.com';
    const url = `${baseUrl}/checkout/${planId}/?${params.toString()}`;
    window.open(url, '_blank');
  };

  return (
    <Button className="w-full gap-2 rounded-full" size="lg" onClick={handleClick}>
      Subscribe via Whop
    </Button>
  );
}