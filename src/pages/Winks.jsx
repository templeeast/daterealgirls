import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import StickyAdBar from '@/components/shared/StickyAdBar';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function Winks() {
  const navigate = useNavigate();
  const { profile, isLoading: profileLoading } = useMyProfile();
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const [receivedWinks, setReceivedWinks] = useState(null);
  const [sentWinks, setSentWinks] = useState(null);
  const [sentProfiles, setSentProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('received');

  useEffect(() => {
    if (profile?.id) {
      Promise.all([
        base44.entities.Wink.filter({ recipient_profile_id: profile.id }, '-created_date'),
        base44.entities.Wink.filter({ sender_id: profile.user_id }, '-created_date'),
      ]).then(async ([received, sent]) => {
        setReceivedWinks(received);
        setSentWinks(sent);
        // Fetch recipient profiles for sent winks
        const profileIds = [...new Set(sent.map(w => w.recipient_profile_id))];
        const profiles = await Promise.all(
          profileIds.map(pid => base44.entities.MemberProfile.filter({ id: pid }).then(r => r[0]).catch(() => null))
        );
        const map = {};
        profiles.forEach(p => { if (p) map[p.id] = p; });
        setSentProfiles(map);
        setLoading(false);
      });
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
      {/* Sticky JuicyAds bar — stays visible while scrolling */}
      <StickyAdBar zone={config?.juicyads_zone_winks} />

      {/* Tab toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          size="sm"
          variant={tab === 'received' ? 'default' : 'outline'}
          onClick={() => setTab('received')}
        >
          😉 {t('winks_tab_received')}
          {receivedWinks && receivedWinks.length > 0 && (
            <span className="ml-1.5 text-xs opacity-80">({receivedWinks.length})</span>
          )}
        </Button>
        <Button
          size="sm"
          variant={tab === 'sent' ? 'default' : 'outline'}
          onClick={() => setTab('sent')}
        >
          👋 {t('winks_tab_sent')}
          {sentWinks && sentWinks.length > 0 && (
            <span className="ml-1.5 text-xs opacity-80">({sentWinks.length})</span>
          )}
        </Button>
      </div>

      {tab === 'received' && (
        <>
          <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
            😉 {t('winks_received_title', { count: receivedWinks?.length || 0 })}
          </h1>

          {!receivedWinks || receivedWinks.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <p className="text-4xl mb-3">😉</p>
                <p className="font-medium text-lg">{t('winks_empty_received_title')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('winks_empty_received_desc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {receivedWinks.map(wink => (
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
                      <p className="text-sm text-muted-foreground">{t('winks_winked_at_you')}</p>
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
        </>
      )}

      {tab === 'sent' && (
        <>
          <h1 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
            👋 {t('winks_sent_title', { count: sentWinks?.length || 0 })}
          </h1>

          {!sentWinks || sentWinks.length === 0 ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <p className="text-4xl mb-3">👋</p>
                <p className="font-medium text-lg">{t('winks_empty_sent_title')}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('winks_empty_sent_desc')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentWinks.map(wink => {
                const recipient = sentProfiles[wink.recipient_profile_id];
                return (
                  <Card
                    key={wink.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/profile/${wink.recipient_profile_id}`)}
                  >
                    <CardContent className="pt-4 pb-4 flex items-center gap-4">
                      {recipient?.photo_1 ? (
                        <img
                          src={recipient.photo_1}
                          className="w-14 h-14 rounded-full object-cover shrink-0"
                          alt={recipient.display_name}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                          😉
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">{recipient?.display_name || 'Someone'}</p>
                        <p className="text-sm text-muted-foreground">{t('winks_you_winked_at')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground shrink-0">
                        {wink.created_date
                          ? formatDistanceToNow(new Date(wink.created_date), { addSuffix: true })
                          : ''}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}