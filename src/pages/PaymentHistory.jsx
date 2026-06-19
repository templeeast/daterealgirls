import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, CheckCircle2, XCircle, Clock, Tag, Coins } from 'lucide-react';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { useAuth } from '@/lib/AuthContext';

export default function PaymentHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useMyProfile();
  const { config, isLoading: configLoading } = useSiteConfig();
  const [activeTab, setActiveTab] = useState('tokens');

  // Token transaction history (all users)
  const { data: tokenTxs = [], isLoading: txLoading } = useQuery({
    queryKey: ['token-transactions', user?.id],
    queryFn: () => base44.entities.TokenTransaction.filter({ user_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  // Payment history (processor-specific, only for those with purchases)
  const [payments, setPayments] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState(null);

  useEffect(() => {
    if (profileLoading || configLoading || !profile || !config) return;
    // Only fetch external payment history if they've made purchases
    if (!profile.has_purchased_tokens) return;
    const fn = config.payment_processor === 'authorizenet' ? 'authorizeNetPaymentHistory' : 'whopPaymentHistory';
    setPaymentsLoading(true);
    base44.functions.invoke(fn, {})
      .then(res => setPayments(res.data?.payments || []))
      .catch(err => setPaymentsError(err?.response?.data?.error || err.message))
      .finally(() => setPaymentsLoading(false));
  }, [profileLoading, configLoading, profile, config]);

  const isAuthNet = config?.payment_processor === 'authorizenet';

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
    const num = isAuthNet ? parseFloat(amount) : (typeof amount === 'number' ? amount / 100 : parseFloat(amount));
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'USD').toUpperCase() }).format(num);
  };

  const txIcon = (type) => {
    if (type === 'purchase') return <CreditCard className="w-4 h-4 text-primary" />;
    if (type === 'promo') return <Tag className="w-4 h-4 text-purple-500" />;
    if (type === 'spend') return <Coins className="w-4 h-4 text-orange-500" />;
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  };

  const txBadge = (type) => {
    const map = {
      purchase: 'bg-primary/10 text-primary',
      promo: 'bg-purple-100 text-purple-700',
      spend: 'bg-orange-100 text-orange-700',
      bonus: 'bg-green-100 text-green-700',
    };
    return <Badge className={map[type] || ''}>{type}</Badge>;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-profile')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-primary" />
          Payment & Token History
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={activeTab === 'tokens' ? 'default' : 'outline'}
          onClick={() => setActiveTab('tokens')}
        >
          Token Activity
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'payments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('payments')}
        >
          Payment Records
        </Button>
      </div>

      {/* Token Activity Tab */}
      {activeTab === 'tokens' && (
        <>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : tokenTxs.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No token activity recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tokenTxs.map(tx => (
                <Card key={tx.id}>
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {txIcon(tx.type)}
                      <div>
                        <p className="font-medium text-sm">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.created_date)}</p>
                        {tx.promo_code && (
                          <p className="text-xs text-purple-600 font-mono">Code: {tx.promo_code}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {txBadge(tx.type)}
                      <span className={`font-semibold text-sm ${tx.tokens > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {tx.tokens > 0 ? '+' : ''}{tx.tokens.toLocaleString()} tokens
                      </span>
                      {tx.amount_paid && (
                        <span className="text-xs text-muted-foreground">${tx.amount_paid.toFixed(2)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Payment Records Tab */}
      {activeTab === 'payments' && (
        <>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : paymentsError ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>{paymentsError}</p>
              </CardContent>
            </Card>
          ) : !payments || payments.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No payment records found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {isAuthNet
                            ? (payment.description || 'Token Purchase')
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
        </>
      )}
    </div>
  );
}