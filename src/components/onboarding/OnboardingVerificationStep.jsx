import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OnboardingVerificationStep({
  selfieUploaded,
  idUploaded,
  onSelfieUploaded,
  onIdUploaded,
}) {
  const { t } = useTranslation();

  const handleSelfie = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    onSelfieUploaded(file_uri);
  };

  const handleId = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    onIdUploaded(file_uri);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
        <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
        <span>{t('id_docs_privacy_notice')}</span>
      </div>

      {/* Selfie — Required */}
      <div className={`border-2 rounded-xl p-4 space-y-2 ${!selfieUploaded ? 'border-primary/60 bg-accent/30' : 'border-border'}`}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{t('selfie_step_title')}</p>
          <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">{t('required_badge')}</Badge>
        </div>
        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('selfie_step_desc') }} />
        <div className="flex items-center gap-3">
          {selfieUploaded && (
            <span className="text-xs text-primary font-medium">{t('selfie_on_file')}</span>
          )}
          <label>
            <Button variant={selfieUploaded ? 'outline' : 'default'} size="sm" className="gap-2" asChild>
              <span>
                <Camera className="w-4 h-4" />
                {selfieUploaded ? t('replace_selfie') : t('upload_selfie')}
              </span>
            </Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleSelfie} />
          </label>
        </div>
      </div>

      {/* Govt ID — Optional */}
      <div className="border rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{t('govtid_step_title')}</p>
          <Badge variant="outline" className="text-xs px-2 py-0.5">{t('optional_badge')}</Badge>
        </div>
        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('govtid_step_desc') }} />
        <div className="flex items-center gap-3">
          {idUploaded && (
            <span className="text-xs text-primary font-medium">✓ ID on file</span>
          )}
          <label>
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="w-4 h-4" /> {t('upload_govt_id')}
              </span>
            </Button>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleId} />
          </label>
        </div>
      </div>
    </div>
  );
}