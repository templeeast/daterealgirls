import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Mail, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import useSiteConfig from '@/hooks/useSiteConfig';
import LanguageSelector from '@/components/layout/LanguageSelector';
import useMyProfile from '@/hooks/useMyProfile';

export default function ContactUs() {
  const { t } = useTranslation();
  const { config } = useSiteConfig();
  const { user } = useMyProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.SupportTicket.create({
        user_id: user?.id || 'guest',
        user_email: user?.email || form.email,
        category: 'general',
        subject: form.subject,
        description: `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
      });
      setSubmitted(true);
      toast({ title: t('contact_success') });
    } catch {
      toast({ title: t('contact_error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </Link>
          <LanguageSelector />
        </div>

        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <span className="font-heading font-semibold">{config.site_name}</span>
        </div>

        <h1 className="font-heading text-4xl font-bold mb-2">{t('contact_us_title')}</h1>
        <p className="text-muted-foreground mb-10">{t('contact_us_subtitle')}</p>

        {submitted ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-heading text-2xl font-semibold">{t('contact_thanks_title')}</h2>
            <p className="text-muted-foreground">{t('contact_thanks_desc')}</p>
            <Button variant="outline" asChild>
              <Link to="/">{t('back')}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t('contact_name_label')}</Label>
                <Input
                  placeholder={t('contact_name_placeholder')}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t('contact_email_label')}</Label>
                <Input
                  type="email"
                  placeholder={t('contact_email_placeholder')}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('subject_label')}</Label>
              <Input
                placeholder={t('contact_subject_placeholder')}
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('contact_message_label')}</Label>
              <Textarea
                className="min-h-[140px]"
                placeholder={t('contact_message_placeholder')}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? t('submitting') : t('contact_send_btn')}
            </Button>
          </form>
        )}

        {user && (
          <div className="mt-12 pt-8 border-t flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{t('contact_also_support')}{' '}
              <Link to="/support" className="text-primary underline underline-offset-4">{t('support_title')}</Link>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}