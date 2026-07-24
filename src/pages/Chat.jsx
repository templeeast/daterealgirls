import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, User, Image as ImageIcon, Trash2, Coins, Lock, CheckCircle, XCircle, BadgeDollarSign, Video as VideoIcon, Coffee } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import useMyProfile from '@/hooks/useMyProfile';
import useSiteConfig from '@/hooks/useSiteConfig';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import VerificationRequiredModal from '@/components/shared/VerificationRequiredModal';

const requiresIdVerification = (memberProfile) =>
  memberProfile?.verification_status === 'verified' || memberProfile?.didit_verification_status === 'Approved';

function PrivatePhotoRequestCard({ msg, isMe, onRespond }) {
  const { data: accessRecords = [] } = useQuery({
    queryKey: ['accessRecord', msg.private_photo_access_id],
    queryFn: () => base44.entities.PrivatePhotoAccess.filter({ id: msg.private_photo_access_id }),
    enabled: !!msg.private_photo_access_id,
    refetchInterval: 5000,
  });
  const access = accessRecords[0];
  const isPending = !access || access.status === 'pending';

  if (isMe) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-muted rounded-2xl rounded-br-md px-4 py-3 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 inline mr-1" />
          You requested access to their private photos.
          {isPending ? ' (Awaiting response)' : access?.status === 'granted' ? ' ✅ Granted!' : ' Declined.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-primary/5 border border-primary/20 rounded-2xl rounded-bl-md px-4 py-3 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          {msg.sender_name} would like to view your private photos.
        </p>
        {isPending ? (
          <div className="flex gap-2">
            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => onRespond('granted')}>
              <CheckCircle className="w-3.5 h-3.5" /> Grant Access
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30" onClick={() => onRespond('denied')}>
              <XCircle className="w-3.5 h-3.5" /> Decline
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {access?.status === 'granted' ? '✅ You granted access.' : 'You declined this request.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const conversationId = window.location.pathname.split('/chat/')[1];
  const navigate = useNavigate();
  const { user, profile } = useMyProfile();
  const { config } = useSiteConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [showVerifModal, setShowVerifModal] = useState(false);
  const messageTimes = useRef([]);
  const messagesEndRef = useRef(null);

  const rateLimitCount = config?.msg_rate_limit_count ?? 5;
  const rateLimitSeconds = config?.msg_rate_limit_seconds ?? 10;

  const isMale = profile?.gender === 'male';
  const msgTokenEnabled = isMale ? (config?.tokens_msg_men_enabled !== false) : (config?.tokens_msg_women_enabled || false);
  const msgTokenCost = isMale ? (config?.tokens_msg_cost_men ?? 50) : (config?.tokens_msg_cost_women ?? 0);
  const photoTokenCost = config?.tokens_msg_photo_cost ?? 5;
  const videoTokenCost = isMale ? (config?.tokens_msg_video_cost_men ?? 10) : (config?.tokens_msg_video_cost_women ?? 10);
  const videosChatEnabled = isMale ? (config?.videos_chat_men_enabled === true) : (config?.videos_chat_women_enabled === true);
  const maxVideoDuration = config?.max_video_duration_seconds ?? 30;
  const maxVideoFileSizeMB = config?.max_video_file_size_mb ?? 25;
  const tokens = profile?.tokens ?? 0;

  const showTokenLock = msgTokenEnabled && msgTokenCost > 0 && tokens < msgTokenCost;

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

  // Mark conversation as read when opened (clears the unread badge on Messages list)
  useEffect(() => {
    if (!conversation || !user?.id) return;
    const isP1 = conversation.participant_1_id === user.id;
    const myUnread = isP1 ? (conversation.unread_count_1 || 0) : (conversation.unread_count_2 || 0);
    if (myUnread === 0) return;
    (async () => {
      // Mark incoming unread messages as read
      const incoming = (messages || []).filter(m => m.sender_id !== user.id && !m.is_read);
      if (incoming.length > 0) {
        await base44.entities.Message.bulkUpdate(
          incoming.map(m => ({ id: m.id, is_read: true }))
        );
      }
      // Reset this participant's unread count
      await base44.entities.Conversation.update(conversation.id, {
        [isP1 ? 'unread_count_1' : 'unread_count_2']: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    })();
  }, [conversation?.id, user?.id]);

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
      // Deduct tokens if applicable
      if (msgTokenEnabled && msgTokenCost > 0) {
        await base44.entities.MemberProfile.update(myProfile.id, {
          tokens: Math.max(0, tokens - msgTokenCost),
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
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

  const deleteVideoMutation = useMutation({
    mutationFn: async (msgId) => {
      await base44.entities.Message.update(msgId, { video_url: '', video_thumbnail_url: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    if (!requiresIdVerification(profile)) {
      setShowVerifModal(true);
      return;
    }
    if (!checkRateLimit()) return;
    sendMutation.mutate(text.trim());
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!requiresIdVerification(profile)) {
      setShowVerifModal(true);
      e.target.value = '';
      return;
    }

    // Check if user can afford the photo token cost
    const canAffordPhoto = !isMale || tokens >= photoTokenCost;
    if (!canAffordPhoto) {
      alert(t('chat_photo_insufficient_tokens', { n: photoTokenCost }));
      e.target.value = '';
      return;
    }

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

      // Deduct photo tokens for male users
      if (isMale && photoTokenCost > 0) {
        await base44.entities.MemberProfile.update(myProfile.id, {
          tokens: Math.max(0, tokens - photoTokenCost),
        });
        await base44.entities.TokenTransaction.create({
          user_id: user.id,
          type: 'spend',
          tokens: -photoTokenCost,
          description: 'Photo message embed',
        });
      }

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
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    };
    reader.readAsDataURL(file);
  };

  const handleVideoSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!requiresIdVerification(profile)) {
      setShowVerifModal(true);
      e.target.value = '';
      return;
    }
    if (file.size > maxVideoFileSizeMB * 1024 * 1024) {
      alert(t('chat_video_too_large', { n: maxVideoFileSizeMB }));
      e.target.value = '';
      return;
    }
    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = async () => {
      if (videoEl.duration > maxVideoDuration) {
        alert(t('chat_video_too_long', { n: maxVideoDuration }));
        e.target.value = '';
        return;
      }
      if (tokens < videoTokenCost) {
        alert(t('chat_video_insufficient_tokens', { n: videoTokenCost }));
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await base44.functions.invoke('uploadToCloudinary', {
          file: base64,
          filename: file.name,
          media_type: 'video',
          content_type: file.type,
        });
        const videoUrl = res.data?.url;
        const thumbnailUrl = res.data?.thumbnail_url;
        if (!videoUrl) return;
        const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
        if (videoTokenCost > 0) {
          await base44.entities.MemberProfile.update(myProfile.id, {
            tokens: Math.max(0, tokens - videoTokenCost),
          });
          await base44.entities.TokenTransaction.create({
            user_id: user.id,
            type: 'spend',
            tokens: -videoTokenCost,
            description: 'Video message embed',
          });
        }
        await base44.entities.Message.create({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_name: myProfile?.display_name || 'User',
          content: '🎥 Video',
          video_url: videoUrl,
          video_thumbnail_url: thumbnailUrl,
          message_type: 'video',
        });
        await base44.entities.Conversation.update(conversationId, {
          last_message: '🎥 Video',
          last_message_date: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      };
      reader.readAsDataURL(file);
    };
    videoEl.src = URL.createObjectURL(file);
  };

  if (!conversation) return null;

  

  const isP1 = conversation.participant_1_id === user?.id;
  const otherName = isP1 ? conversation.participant_2_name : conversation.participant_1_name;
  const otherPhoto = isP1 ? conversation.participant_2_photo : conversation.participant_1_photo;
  const otherId = isP1 ? conversation.participant_2_id : conversation.participant_1_id;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <VerificationRequiredModal
        open={showVerifModal}
        onClose={() => setShowVerifModal(false)}
        onVerify={async () => {
          if (!profile?.id) throw new Error('Profile not found');
          const res = await base44.functions.invoke('createDiditSession', { memberId: profile.id });
          const result = res.data;
          if (!result?.url) throw new Error('Could not start verification. Please try again.');
          await base44.entities.MemberProfile.update(profile.id, {
            didit_session_id: result.session_id,
            didit_verification_status: 'pending',
          });
          window.location.href = result.url;
        }}
      />
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

            // Private photo request card
            if (msg.message_type === 'private_photo_request') {
              return (
                <PrivatePhotoRequestCard
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  onRespond={(response) => {
                    base44.functions.invoke('respondToPrivatePhotoAccess', {
                      accessId: msg.private_photo_access_id,
                      response,
                    }).then(() => queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }));
                  }}
                />
              );
            }

            if (msg.message_type === 'private_photo_access_granted') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Private photo access granted!
                  </div>
                </div>
              );
            }

            if (msg.message_type === 'private_photo_access_denied') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="flex items-center gap-2 bg-muted border rounded-xl px-4 py-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" /> Private photo access was declined.
                  </div>
                </div>
              );
            }

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
                    {msg.video_url && (
                      <div className="relative group">
                        <video src={msg.video_url} poster={msg.video_thumbnail_url} controls className="rounded-lg max-w-full mb-2" />
                        {isMe && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteVideoMutation.mutate(msg.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                    {msg.content && msg.content !== '📷 Photo' && msg.content !== '🎥 Video' && (
                      (msg.content.startsWith('https://buy.stripe.com/') || msg.content.includes('buymeacoffee.com')) ? (
                        <a
                          href={msg.content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm underline break-all ${isMe ? 'text-primary-foreground' : 'text-primary'}`}
                          onClick={e => e.stopPropagation()}
                        >
                          {msg.content}
                        </a>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )
                    )}
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
      {showTokenLock ? (
        <div className="border-t bg-card px-4 py-4">
          <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto bg-accent/50 rounded-xl p-3">
            <Coins className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">Each message costs {msgTokenCost} tokens. You need more tokens to continue.</p>
            <Button size="sm" className="rounded-full shrink-0" onClick={() => navigate('/my-profile')}>
              Buy Tokens
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t bg-card px-4 py-3">
          {(msgTokenEnabled && msgTokenCost > 0) || isMale || videosChatEnabled ? (
            <div className="flex justify-center mb-2 flex-wrap gap-x-3 gap-y-0.5">
              {msgTokenEnabled && msgTokenCost > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {t('chat_token_cost_message', { n: msgTokenCost })}
                </span>
              )}
              {isMale && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {t('chat_token_cost_photo', { n: photoTokenCost })}
                </span>
              )}
              {videosChatEnabled && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {t('chat_token_cost_video', { n: videoTokenCost })}
                </span>
              )}
              {(() => {
                const stripeEnabled = isMale ? config?.stripe_payment_link_enabled_men : config?.stripe_payment_link_enabled_women;
                const linkCost = config?.stripe_link_message_credit_cost ?? 5;
                return stripeEnabled && linkCost > 0 ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {t('stripe.payment_link.chat_cost_hint', { n: linkCost })}
                  </span>
                ) : null;
              })()}
              {(() => {
                const bmcEnabled = isMale ? config?.buymeacoffee_enabled_men : config?.buymeacoffee_enabled_women;
                const bmcCost = config?.buymeacoffee_message_credit_cost ?? 5;
                return bmcEnabled && bmcCost > 0 ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {t('bmc.chat_cost_hint', { n: bmcCost })}
                  </span>
                ) : null;
              })()}
              <span className="text-xs text-muted-foreground">· {t('chat_token_balance', { n: tokens.toLocaleString() })}</span>
            </div>
          ) : null}
          {/* Payment link legal disclaimer */}
          {(() => {
            const isVerified = requiresIdVerification(profile);
            const stripeEnabled = isMale ? config?.stripe_payment_link_enabled_men : config?.stripe_payment_link_enabled_women;
            const showPaymentBtn = isVerified && stripeEnabled;
            return showPaymentBtn ? (
              <p className="text-xs text-gray-400 text-center mb-1 max-w-3xl mx-auto px-1">
                {t('stripe.payment_link.composer.legal_disclaimer')}
              </p>
            ) : null;
          })()}
          {/* Payment link insufficient tokens notice */}
          {(() => {
            const isVerified = requiresIdVerification(profile);
            const stripeEnabled = isMale ? config?.stripe_payment_link_enabled_men : config?.stripe_payment_link_enabled_women;
            const hasPaymentLink = !!profile?.stripe_payment_link;
            const linkCost = config?.stripe_link_message_credit_cost ?? 5;
            const showPaymentBtn = isVerified && stripeEnabled;
            const insufficientTokens = showPaymentBtn && hasPaymentLink && tokens < linkCost;
            return insufficientTokens ? (
              <div className="flex items-center justify-center gap-2 mb-1 max-w-3xl mx-auto px-1">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('stripe.payment_link.message_embed.insufficient_tokens', { n: linkCost })}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => navigate('/my-profile')}
                >
                  {t('stripe.payment_link.message_embed.buy_tokens')}
                </Button>
              </div>
            ) : null;
          })()}
          {/* BuyMeACoffee insufficient tokens notice */}
          {(() => {
            const isVerified = requiresIdVerification(profile);
            const bmcEnabled = isMale ? config?.buymeacoffee_enabled_men : config?.buymeacoffee_enabled_women;
            const hasBmcLink = !!profile?.buymeacoffee_link;
            const bmcCost = config?.buymeacoffee_message_credit_cost ?? 5;
            const showBmcBtn = isVerified && bmcEnabled;
            const insufficientTokens = showBmcBtn && hasBmcLink && tokens < bmcCost;
            return insufficientTokens ? (
              <div className="flex items-center justify-center gap-2 mb-1 max-w-3xl mx-auto px-1">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('bmc.message_embed.insufficient_tokens', { n: bmcCost })}
                </p>
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0 text-xs text-primary"
                  onClick={() => navigate('/my-profile')}
                >
                  {t('bmc.message_embed.buy_tokens')}
                </Button>
              </div>
            ) : null;
          })()}
          <div className="flex gap-2 items-center max-w-3xl mx-auto">
            <label>
              <Button variant="ghost" size="icon" className="shrink-0" asChild>
                <span><ImageIcon className="w-5 h-5" /></span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSend} />
            </label>
            {videosChatEnabled && (
              <label>
                <Button variant="ghost" size="icon" className="shrink-0" asChild>
                  <span><VideoIcon className="w-5 h-5" /></span>
                </Button>
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoSend} />
              </label>
            )}
            {/* Payment link embed button */}
            {(() => {
              const isVerified = requiresIdVerification(profile);
              const stripeEnabled = isMale ? config?.stripe_payment_link_enabled_men : config?.stripe_payment_link_enabled_women;
              const hasPaymentLink = !!profile?.stripe_payment_link;
              const linkCost = config?.stripe_link_message_credit_cost ?? 5;
              let tooltipMsg = '';
              let btnDisabled = true;
              if (!isVerified) tooltipMsg = t('stripe.payment_link.not_verified.tooltip');
              else if (!stripeEnabled) tooltipMsg = t('stripe.payment_link.not_enabled.tooltip');
              else if (!hasPaymentLink) tooltipMsg = t('stripe.payment_link.missing.prompt');
              else if (tokens < linkCost) tooltipMsg = t('stripe.payment_link.message_embed.cost_notice', { n: linkCost });
              else btnDisabled = false;
              if (!stripeEnabled) return null;
              const handleEmbedPaymentLink = async () => {
                if (btnDisabled) { if (tooltipMsg) alert(tooltipMsg); return; }
                const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
                await base44.entities.MemberProfile.update(myProfile.id, { tokens: Math.max(0, tokens - linkCost) });
                await base44.entities.TokenTransaction.create({
                  user_id: user.id,
                  type: 'spend',
                  tokens: -linkCost,
                  description: 'Stripe payment link message embed',
                });
                await base44.entities.Message.create({
                  conversation_id: conversationId,
                  sender_id: user.id,
                  sender_name: myProfile?.display_name || 'User',
                  content: profile.stripe_payment_link,
                });
                const isP1 = conversation.participant_1_id === user.id;
                await base44.entities.Conversation.update(conversationId, {
                  last_message: profile.stripe_payment_link,
                  last_message_date: new Date().toISOString(),
                  [isP1 ? 'unread_count_2' : 'unread_count_1']:
                    (isP1 ? (conversation.unread_count_2 || 0) : (conversation.unread_count_1 || 0)) + 1,
                });
                queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });
              };
              return (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  title={btnDisabled ? tooltipMsg : t('stripe.payment_link.message_embed.tooltip')}
                  disabled={btnDisabled}
                  onClick={handleEmbedPaymentLink}
                >
                  <BadgeDollarSign className="w-5 h-5" />
                </Button>
              );
            })()}
            {/* BuyMeACoffee embed button */}
            {(() => {
              const isVerified = requiresIdVerification(profile);
              const bmcEnabled = isMale ? config?.buymeacoffee_enabled_men : config?.buymeacoffee_enabled_women;
              const hasBmcLink = !!profile?.buymeacoffee_link;
              const bmcCost = config?.buymeacoffee_message_credit_cost ?? 5;
              let tooltipMsg = '';
              let btnDisabled = true;
              if (!isVerified) tooltipMsg = t('bmc.not_verified.tooltip');
              else if (!bmcEnabled) tooltipMsg = t('bmc.not_enabled.tooltip');
              else if (!hasBmcLink) tooltipMsg = t('bmc.missing.prompt');
              else if (tokens < bmcCost) tooltipMsg = t('bmc.message_embed.cost_notice', { n: bmcCost });
              else btnDisabled = false;
              if (!bmcEnabled) return null;
              const handleEmbedBmcLink = async () => {
                if (btnDisabled) { if (tooltipMsg) alert(tooltipMsg); return; }
                const myProfile = (await base44.entities.MemberProfile.filter({ user_id: user.id }))[0];
                await base44.entities.MemberProfile.update(myProfile.id, { tokens: Math.max(0, tokens - bmcCost) });
                await base44.entities.TokenTransaction.create({
                  user_id: user.id,
                  type: 'spend',
                  tokens: -bmcCost,
                  description: 'BuyMeACoffee link message embed',
                });
                await base44.entities.Message.create({
                  conversation_id: conversationId,
                  sender_id: user.id,
                  sender_name: myProfile?.display_name || 'User',
                  content: profile.buymeacoffee_link,
                });
                const isP1 = conversation.participant_1_id === user.id;
                await base44.entities.Conversation.update(conversationId, {
                  last_message: profile.buymeacoffee_link,
                  last_message_date: new Date().toISOString(),
                  [isP1 ? 'unread_count_2' : 'unread_count_1']:
                    (isP1 ? (conversation.unread_count_2 || 0) : (conversation.unread_count_1 || 0)) + 1,
                });
                queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
                queryClient.invalidateQueries({ queryKey: ['myProfile'] });
              };
              return (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  title={btnDisabled ? tooltipMsg : t('bmc.message_embed.tooltip')}
                  disabled={btnDisabled}
                  onClick={handleEmbedBmcLink}
                >
                  <Coffee className="w-5 h-5" />
                </Button>
              );
            })()}
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