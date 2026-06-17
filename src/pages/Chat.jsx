import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, Image as ImageIcon, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

export default function Chat() {
  const conversationId = window.location.pathname.split('/chat/')[1];
  const navigate = useNavigate();
  const { user, profile } = useMyProfile();
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const messageTimes = useRef([]);
  const messagesEndRef = useRef(null);

  const rateLimitCount = config?.msg_rate_limit_count ?? 5;
  const rateLimitSeconds = config?.msg_rate_limit_seconds ?? 10;

  const checkRateLimit = () => {
    const now = Date.now();
    const windowMs = rateLimitSeconds * 1000;
    messageTimes.current = messageTimes.current.filter(t => now - t < windowMs);
    if (messageTimes.current.length >= rateLimitCount) {
      setRateLimited(true);
      const oldest = messageTimes.current[0];
      const resetIn = windowMs - (now - oldest);
      setTimeout(() => setRateLimited(false), resetIn);
      return false;
    }
    messageTimes.current.push(now);
    return true;
  };

  const { data: conversation } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const convos = await base44.entities.Conversation.filter({ id: conversationId });
      return convos[0] || null;
    },
    enabled: !!conversationId,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
    enabled: !!conversationId,
    initialData: [],
    refetchInterval: 5000,
  });

  // Subscribe for real-time updates
  useEffect(() => {
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    });
    return unsub;
  }, [conversationId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: myProfile?.display_name || 'User',
        content,
      });
      // Update conversation's last message
      const isP1 = conversation.participant_1_id === user.id;
      await base44.entities.Conversation.update(conversationId, {
        last_message: content.slice(0, 100),
        last_message_date: new Date().toISOString(),
        [isP1 ? 'unread_count_2' : 'unread_count_1']:
          (isP1 ? (conversation.unread_count_2 || 0) : (conversation.unread_count_1 || 0)) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setText('');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (msgId) => {
      await base44.entities.Message.update(msgId, { image_url: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    if (!checkRateLimit()) return;
    sendMutation.mutate(text.trim());
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      const res = await base44.functions.invoke('uploadToCloudinary', {
        file: base64,
        filename: file.name,
      });
      const imageUrl = res.data?.url;
      if (!imageUrl) return;

      const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: myProfile?.display_name || 'User',
        content: '📷 Photo',
        image_url: imageUrl,
      });
      await base44.entities.Conversation.update(conversationId, {
        last_message: '📷 Photo',
        last_message_date: new Date().toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    };
    reader.readAsDataURL(file);
  };

  if (!conversation) return null;

  const isP1 = conversation.participant_1_id === user?.id;
  const otherName = isP1 ? conversation.participant_2_name : conversation.participant_1_name;
  const otherPhoto = isP1 ? conversation.participant_2_photo : conversation.participant_1_photo;
  const otherId = isP1 ? conversation.participant_2_id : conversation.participant_1_id;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-card px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Link to={`/profile/${otherId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          {otherPhoto ? (
            <img src={otherPhoto} className="w-9 h-9 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
          <h2 className="font-medium">{otherName || 'User'}</h2>
        </Link>
      </div>

      {/* Retention Notice */}
      {(config?.chat_retention_days ?? 90) > 0 && (
        <div className="bg-muted/50 border-b px-4 py-1.5 text-center">
          <p className="text-xs text-muted-foreground">
            {t('chat_retention_notice', { days: config.chat_retention_days ?? 90 })}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
              <Skeleton className="h-10 w-48 rounded-2xl" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t('chat_no_messages')}</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-1' : ''}`}>
                  <div className={`px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  }`}>
                    {msg.image_url && (
                      <div className="relative group">
                        <img src={msg.image_url} className="rounded-lg max-w-full mb-2" alt="" />
                        {isMe && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteImageMutation.mutate(msg.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-sm">{msg.content !== '📷 Photo' ? msg.content : ''}</p>
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-right' : ''}`}>
                    {msg.created_date && format(new Date(msg.created_date), 'h:mm a')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {config?.men_subscription_enabled && profile?.gender === 'male' && profile?.subscription_status !== 'active' ? (
        <div className="border-t bg-card px-4 py-4">
          <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto bg-accent/50 rounded-xl p-3">
            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{t('subscription_upgrade_cta')} to send messages.</p>
            <Button size="sm" className="rounded-full shrink-0" onClick={() => navigate('/my-profile')}>
              {t('get_premium')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t bg-card px-4 py-3">
          <div className="flex gap-2 items-center max-w-3xl mx-auto">
            <label>
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <span><ImageIcon className="w-5 h-5" /></span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
            </label>
            <Input
              placeholder={rateLimited ? `Slow down — too many messages` : t('type_message')}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className={`rounded-full ${rateLimited ? 'border-destructive text-destructive' : ''}`}
              disabled={rateLimited}
            />
            <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!text.trim() || rateLimited}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}