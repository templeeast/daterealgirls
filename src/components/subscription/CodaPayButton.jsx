import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Loader2, CheckCircle } from 'lucide-react';

// Common country/currency pairs CodaPay supports
const COUNTRY_OPTIONS = [
  { label: 'Singapore', country: 702, currency: 'SGD' },
  { label: 'Malaysia', country: 458, currency: 'MYR' },
  { label: 'Indonesia', country: 360, currency: 'IDR' },
  { label: 'Thailand', country: 764, currency: 'THB' },
  { label: 'Philippines', country: 608, currency: 'PHP' },
  { label: 'Vietnam', country: 704, currency: 'VND' },
  { label: 'Taiwan', country: 158, currency: 'TWD' },
  { label: 'United States', country: 840, currency: 'USD' },
];

const USE_SANDBOX = true; // Toggle to false for production

export default function CodaPayButton({ price, onSuccess }) {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [txnId, setTxnId] = useState(null);
  const [pollCountry, setPollCountry] = useState(null);

  // Check for return from CodaPay redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnTxnId = params.get('codapay_txn');
    const returnCountry = params.get('codapay_country');
    if (returnTxnId && returnCountry) {
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('codapay_txn');
      url.searchParams.delete('codapay_country');
      window.history.replaceState({}, '', url.toString());
      checkStatus(returnTxnId, Number(returnCountry));
    }
  }, []);

  // Poll status after popup closes
  useEffect(() => {
    if (!txnId || !pollCountry) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await base44.functions.invoke('codapayCheckStatus', {
        txnId,
        country: pollCountry,
        useSandbox: USE_SANDBOX,
      });
      const { status } = res.data;
      if (status === 'success') {
        clearInterval(interval);
        setPolling(false);
        setTxnId(null);
        toast({ title: '✓ Payment successful! Your subscription is now active.' });
        onSuccess?.();
      } else if (status === 'failed' || attempts >= 20) {
        clearInterval(interval);
        setPolling(false);
        setTxnId(null);
        if (status === 'failed') toast({ title: 'Payment failed or was cancelled.', variant: 'destructive' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [txnId, pollCountry]);

  const checkStatus = async (id, country) => {
    setPolling(true);
    setTxnId(id);
    setPollCountry(country);
  };

  const handlePay = async () => {
    if (!selectedCountry) {
      toast({ title: 'Please select your country first.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const option = COUNTRY_OPTIONS.find(o => String(o.country) === selectedCountry);

    const res = await base44.functions.invoke('codapayInitPayment', {
      country: option.country,
      currency: option.currency,
      price: price,
      itemName: 'Premium Subscription (1 month)',
      useSandbox: USE_SANDBOX,
    });

    setLoading(false);

    if (res.data?.error) {
      toast({ title: res.data.error, variant: 'destructive' });
      return;
    }

    const { redirectUrl, txnId: newTxnId } = res.data;

    // Open in new tab, poll for result
    const popup = window.open(redirectUrl, '_blank');
    setTxnId(newTxnId);
    setPollCountry(option.country);
    setPolling(true);

    // Also poll when popup closes
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
      }
    }, 1000);
  };

  if (polling) {
    return (
      <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-xl text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        Waiting for payment confirmation...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-sm">Your Country / Region</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Select country..." />
          </SelectTrigger>
          <SelectContent>
            {COUNTRY_OPTIONS.map(o => (
              <SelectItem key={o.country} value={String(o.country)}>
                {o.label} ({o.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full gap-2 rounded-full"
        size="lg"
        onClick={handlePay}
        disabled={loading || !selectedCountry}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to payment...</>
        ) : (
          <><CreditCard className="w-4 h-4" /> Pay ${price}/month with CodaPay</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Powered by CodaPay · Secure hosted payment page
      </p>
    </div>
  );
}