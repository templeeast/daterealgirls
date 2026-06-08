import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import { formatDistanceToNow } from 'date-fns';

export default function Winks() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useMyProfile();
  const [winks, setWinks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      base44.entities.Wink.filter({ recipient_profile_id: profile.id }, '-created_date')
        .then(data => { setWinks(data); setLoading(false); });
    } else if (!profileLoading) {
      setLoading(false);
    }
  }, [profile?.id, profileLoading]);

  if (loading || profileLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6 flex items-center gap-2">
        😉 Winks Received
        {winks && winks.length > 0 && (
          <span className="text-lg font-normal text-muted-foreground">({winks.length})</span>
        )}
      </h1>

      {!winks || winks.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center">
            <p className="text-4xl mb-3">😉</p>
            <p className="font-medium text-lg">No winks yet</p>
            <p className="text-sm text-muted-foreground mt-1">When someone winks at you, they'll appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {winks.map(wink => (
            <Card
              key={wink.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/profile/${wink.sender_id}`)}
            >
              <CardContent className="pt-4 pb-4 flex items-center gap-4">
                {wink.sender_photo ? (
                  <img
                    src={wink.sender_photo}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                    alt={wink.sender_name}
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                    😉
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-base truncate">{wink.sender_name || 'Someone'}</p>
                  <p className="text-sm text-muted-foreground">Winked at you 😉</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {wink.created_date
                    ? formatDistanceToNow(new Date(wink.created_date), { addSuffix: true })
                    : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}