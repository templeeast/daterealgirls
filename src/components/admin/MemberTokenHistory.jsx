import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, CheckCircle2, Tag, Coins, Loader2 } from 'lucide-react';

export default function MemberTokenHistory({ profile, onClose }) {
  const [activeTab, setActiveTab] = useState('tokens');
  const userId = profile?.user_id;

  const { data: tokenTxs = [], isLoading: txLoading } = useQuery({
    queryKey: ['admin-token-transactions', userId],
    queryFn: () => base44.entities.TokenTransaction.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments', userId],
    queryFn: () => base44.entities.Payment.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(typeof timestamp === 'number' ? timestamp * 1000 : timestamp);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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

  const whopStatusBadge = (status) => {
    if (status === 'succeeded') return <Badge className="bg-green-100 text-green-700">Succeeded</Badge>;
    if (status === 'failed') return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
    if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    if (status === 'refunded') return <Badge className="bg-gray-100 text-gray-600">Refunded</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const packLabel = (rec) => {
    const labels = { starter: 'Starter Pack', popular: 'Popular Pack', value: 'Value Pack', best: 'Best Deal Pack' };
    const name = labels[rec.token_pack_name] || rec.token_pack_name || 'Token Pack';
    return rec.tokens_purchased ? `${name} — ${rec.tokens_purchased.toLocaleString()} tokens` : name;
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No user ID on file for this member — token history unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          Token & Purchase History — {profile.display_name}
        </h3>
        <span className="text-xs text-muted-foreground">
          Current balance: <span className="font-semibold text-foreground">{(profile.tokens || 0).toLocaleString()}</span> tokens
        </span>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={activeTab === 'tokens' ? 'default' : 'outline'} onClick={() => setActiveTab('tokens')}>
          Token Activity
        </Button>
        <Button size="sm" variant={activeTab === 'payments' ? 'default' : 'outline'} onClick={() => setActiveTab('payments')}>
          Payment Records
        </Button>
      </div>

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
                <p className="text-sm">No token activity recorded.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
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
                        {tx.tokens > 0 ? '+' : ''}{tx.tokens.toLocaleString()}
                      </span>
                      {tx.amount_paid != null && (
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

      {activeTab === 'payments' && (
        <>
          {paymentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : payments.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No payment records found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {payments.map(rec => (
                <Card key={rec.id}>
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{packLabel(rec)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(rec.created_date)}</p>
                        {rec.whop_payment_id && (
                          <p className="text-xs text-muted-foreground font-mono">{rec.whop_payment_id}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-semibold text-sm">
                        {rec.amount_paid != null
                          ? new Intl.NumberFormat(undefined, { style: 'currency', currency: rec.currency || 'USD' }).format(rec.amount_paid / 100)
                          : '—'}
                      </span>
                      {whopStatusBadge(rec.payment_status)}
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