import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, isLoading: profileLoading } = useMyProfile();
  const { config, isLoading: configLoading } = useSiteConfig();
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileLoading || configLoading) return;
    if (!profile || profile.gender !== 'male') {
      navigate('/my-profile');
      return;
    }
    const fn = config?.payment_processor === 'authorizenet'
      ? 'authorizeNetPaymentHistory'
      : 'whopPaymentHistory';
    base44.functions.invoke(fn, {})
      .then(res => setPayments(res.data?.payments || []))
      .catch(err => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [profileLoading, configLoading, profile, config]);

  const isAuthNet = config?.payment_processor === 'authorizenet';

  const statusIcon = (status) => {
    const settled = ['settledSuccessfully', 'paid', 'capturedPendingSettlement'];
    const failed = ['failed', 'declined', 'voided', 'refunded', 'generalError'];
    if (settled.some(s => status?.toLowerCase().includes(s.toLowerCase()) || status === s)) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (failed.some(s => status?.toLowerCase().includes(s.toLowerCase()) || status === s)) return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const statusBadge = (status) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    const settled = status === 'paid' || status.toLowerCase().includes('settled');
    const failed = ['failed', 'declined', 'voided', 'refunded'].some(s => status.toLowerCase().includes(s));
    if (settled) return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
    if (failed) return <Badge className="bg-destructive/10 text-destructive">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount, currency) => {
    if (amount == null) return '—';
    // Whop returns cents (integer), Authorize.net returns dollars (float string)
    const num = isAuthNet ? parseFloat(amount) : (typeof amount === 'number' ? amount / 100 : parseFloat(amount));
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'USD').toUpperCase(),
    }).format(num);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-profile')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Payment History
        </h1>
      </div>

      {(loading || profileLoading) && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && payments?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No payment records found.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && payments && payments.length > 0 && (
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {statusIcon(payment.status)}
                  <div>
                    <p className="font-medium text-sm">
                      {isAuthNet
                        ? (payment.description || 'Subscription Payment')
                        : (payment.plan_id || payment.membership_id || 'Subscription')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(isAuthNet ? payment.submitted_at : payment.created_at)}
                    </p>
                    {isAuthNet && payment.account_number && (
                      <p className="text-xs text-muted-foreground">
                        {payment.account_type} ···{payment.account_number.replace(/X/g, '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm">
                    {formatAmount(
                      isAuthNet ? payment.amount : (payment.final_amount || payment.amount),
                      payment.currency
                    )}
                  </span>
                  {statusBadge(payment.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}