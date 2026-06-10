import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Loader2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Sandbox mode is driven by site config (dev_mode flag) passed in via props

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export default function AuthorizeNetButton({ price, onSuccess, devMode = false }) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('US');

  const handlePay = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv || !firstName || !lastName || !address || !city || !state || !zip) {
      toast({ title: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('authorizeNetCreateSubscription', {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvv,
        amount: price,
        useSandbox: devMode,
        firstName,
        lastName,
        address,
        city,
        state,
        zip,
        country,
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

      {/* Cardholder Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">{t('card_first_name')}</Label>
          <Input
            placeholder="John"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('card_last_name')}</Label>
          <Input
            placeholder="Doe"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Card Details */}
      <div className="space-y-1.5">
        <Label className="text-sm">{t('card_number')}</Label>
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
          <Label className="text-sm">{t('card_expiry')}</Label>
          <Input
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={e => setCardExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            autoComplete="cc-exp"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('card_cvv')}</Label>
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

      {/* Billing Address */}
      <div className="pt-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('billing_address')}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">{t('billing_street')}</Label>
            <Input
              placeholder="123 Main St"
              value={address}
              onChange={e => setAddress(e.target.value)}
              autoComplete="billing street-address"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('billing_city')}</Label>
              <Input
                placeholder="New York"
                value={city}
                onChange={e => setCity(e.target.value)}
                autoComplete="billing address-level2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('billing_state')}</Label>
              <Input
                placeholder="NY"
                value={state}
                onChange={e => setState(e.target.value)}
                autoComplete="billing address-level1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('billing_zip')}</Label>
              <Input
                placeholder="10001"
                value={zip}
                onChange={e => setZip(e.target.value)}
                autoComplete="billing postal-code"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('billing_country')}</Label>
              <Input
                placeholder="US"
                value={country}
                onChange={e => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                maxLength={2}
                autoComplete="billing country"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full gap-2 rounded-full"
        size="lg"
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> {t('card_btn_processing')}</>
        ) : (
          <><CreditCard className="w-4 h-4" /> {t('card_btn_start_trial')}</>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Lock className="w-3 h-3" /> {t('card_footnote_price', { price })}
      </p>
      <p className="text-xs text-center text-muted-foreground">
        {t('card_footnote_security')}
      </p>
    </form>
  );
}