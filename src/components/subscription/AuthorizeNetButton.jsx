import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Loader2, Lock } from 'lucide-react';

// Sandbox toggle — set to false for production
const USE_SANDBOX = true;

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function AuthorizeNetButton({ price, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      toast({ title: 'Please fill in all card details.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('authorizeNetCreateSubscription', {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvv,
        amount: price,
        useSandbox: USE_SANDBOX,
      });

      if (res.data?.error) {
        toast({ title: res.data.error, variant: 'destructive' });
        return;
      }

      toast({ title: '✓ Free trial started! Your first month is free, then $' + price + '/month after that.' });
      onSuccess?.();
    } catch (err) {
      const errMsg = err?.response?.data?.error || 'Subscription failed. Please try again.';
      toast({ title: errMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Card Number</Label>
        <Input
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChange={e => setCardNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          autoComplete="cc-number"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Expiry (MM/YY)</Label>
          <Input
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            autoComplete="cc-exp"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">CVV</Label>
          <Input
            placeholder="123"
            value={cardCvv}
            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            maxLength={4}
            autoComplete="cc-csc"
            type="password"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full gap-2 rounded-full"
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Start Free Trial</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> First month free, then ${price}/month · Cancel anytime
      </p>
    </form>
  );
}