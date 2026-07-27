import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

export default function VerificationRequiredModal({ open, onClose, onVerify }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyClick = async () => {
    setLoading(true);
    setError('');
    try {
      await onVerify();
      onClose();
    } catch (e) {
      setError(e?.message || t('verif_required_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !loading) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center font-heading">{t('verif_required_title')}</DialogTitle>
          <DialogDescription className="text-center">
            {t('verif_required_desc')}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive text-center px-4">{error}</p>}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full gap-2" onClick={handleVerifyClick} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? t('verif_required_launching') : t('verif_required_button')}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={loading}>
            {t('verif_required_not_now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}