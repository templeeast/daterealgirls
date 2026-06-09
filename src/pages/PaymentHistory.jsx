import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useMyProfile from '@/hooks/useMyProfile';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, isLoading: profileLoading } = useMyProfile();
  const [payments, setPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile || profile.gender !== 'male') {
      navigate('/my-profile');
      return;
    }
    base44.functions.invoke('whopPaymentHistory', {})
      .then(res => setPayments(res.data?.payments || []))
      .catch(err => setError(err?.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [profileLoading, profile]);

  const statusIcon = (status) => {
    if (status === 'paid') return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === 'failed' || status === 'refunded') return <XCircle className="w-4 h-4 text-destructive" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const statusBadge = (status) => {
    if (status === 'paid') return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
    if (status === 'failed') return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
    if (status === 'refunded') return <Badge className="bg-amber-100 text-amber-700">Refunded</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatAmount = (amount, currency) => {
    if (amount == null) return '—';
    const num = typeof amount === 'number' ? amount / 100 : parseFloat(amount);
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
                      {payment.plan_id || payment.membership_id || 'Subscription'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold text-sm">
                    {formatAmount(payment.final_amount || payment.amount, payment.currency)}
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