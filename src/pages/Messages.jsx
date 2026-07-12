import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import useMyProfile from '@/hooks/useMyProfile';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import useSiteConfig from '@/hooks/useSiteConfig';
import StickyAdBar from '@/components/shared/StickyAdBar';
import HilltopAdBar from '@/components/shared/HilltopAdBar';

export default function Messages() {
  const { user } = useMyProfile();
  const { t } = useTranslation();
  const { config } = useSiteConfig();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const c1 = await base44.entities.Conversation.filter({ participant_1_id: user.id }, '-updated_date');
      const c2 = await base44.entities.Conversation.filter({ participant_2_id: user.id }, '-updated_date');
      // Merge and deduplicate
      const map = new Map();
      [...c1, ...c2].forEach(c => map.set(c.id, c));
      const all = Array.from(map.values()).sort((a, b) =>
        new Date(b.last_message_date || b.updated_date) - new Date(a.last_message_date || a.updated_date)
      );
      // Only show conversations that have at least one message sent
      return all.filter(c => !!c.last_message);
    },
    enabled: !!user,
    initialData: [],
  });

  const getOtherParticipant = (convo) => {
    const isP1 = convo.participant_1_id === user?.id;
    return {
      id: isP1 ? convo.participant_2_id : convo.participant_1_id,
      name: isP1 ? convo.participant_2_name : convo.participant_1_name,
      photo: isP1 ? convo.participant_2_photo : convo.participant_1_photo,
      unread: isP1 ? convo.unread_count_1 : convo.unread_count_2,
    };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-heading text-3xl font-bold mb-6">{t('messages_title')}</h1>

      {/* Sticky ad bar — JuicyAds, stays visible while scrolling */}
      <StickyAdBar
        zone={config?.juicyads_zone_messages}
        zoneMobile={config?.juicyads_zone_messages_mobile}
      />

      {/* Sticky ad bar — HilltopAds 300×250 */}
      <HilltopAdBar scriptUrl={config?.hilltopads_zone_winks_messages_favorites} scriptUrlMobile={config?.hilltopads_zone_winks_messages_favorites_mobile} />

      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-xl">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t('messages_empty')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('messages_empty_sub')}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map(convo => {
            const other = getOtherParticipant(convo);
            return (
              <Link key={convo.id} to={`/chat/${convo.id}`}>
                <div className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                  {other.photo ? (
                    <img src={other.photo} className="w-12 h-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">{other.name || 'User'}</h3>
                      {convo.last_message_date && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatDistanceToNow(new Date(convo.last_message_date), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {convo.last_message || t('start_chatting')}
                      </p>
                      {other.unread > 0 && (
                        <Badge className="bg-primary text-primary-foreground ml-2 shrink-0 text-xs h-5 min-w-[20px] flex items-center justify-center rounded-full">
                          {other.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}