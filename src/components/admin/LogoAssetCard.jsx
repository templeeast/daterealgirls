import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download, FileCode, RefreshCw, UploadCloud, Loader2, Save } from 'lucide-react';

export default function LogoAssetCard({
  icon: Icon,
  title,
  description,
  previewUrl,
  customUrl,
  previewClassName = '',
  onDownloadPng,
  onDownloadSvg,
  onRegenerate,
  onUpload,
  uploading = false,
  regenerating = false,
  resolutions,
  regenerateDescription = '',
  onRegenerateDescriptionChange,
  onSave,
  hasUnsavedChanges = false,
  saving = false,
  secondaryCustomUrl,
  secondaryLabel = 'On Billboard',
  onDownloadSecondary,
}) {
  const fileInputRef = useRef(null);
  const [selectedRes, setSelectedRes] = useState(0);
  const hasCustom = !!customUrl;
  const showResolutions = resolutions && resolutions.length > 0;

  const handlePngDownload = () => {
    if (showResolutions) {
      const r = resolutions[selectedRes];
      onDownloadPng?.(r.width, r.height);
    } else {
      onDownloadPng?.();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {hasCustom && (
            <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium shrink-0">Custom</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className={`flex-1 rounded-lg bg-muted/50 flex items-center justify-center min-h-[120px] p-6 ${previewClassName}`}>
            {regenerating ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : hasCustom ? (
              <img src={customUrl} alt={title} className="max-w-full max-h-[160px] object-contain" />
            ) : (
              previewUrl && <img src={previewUrl} alt={title} className="max-w-full max-h-[160px] object-contain" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:w-36 shrink-0">
            {showResolutions && (
              <div className="col-span-2 sm:col-span-1">
                <Select value={String(selectedRes)} onValueChange={v => setSelectedRes(Number(v))}>
                  <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {resolutions.map((r, i) => (
                      <SelectItem key={i} value={String(i)}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button className="bg-black text-white hover:bg-black/80 gap-2" onClick={handlePngDownload} disabled={uploading || regenerating}>
              <Download className="w-4 h-4" /> PNG
            </Button>
            {!hasCustom && (
              <Button variant="outline" className="gap-2" onClick={onDownloadSvg} disabled={regenerating}>
                <FileCode className="w-4 h-4" /> SVG
              </Button>
            )}
            {onRegenerate && (
              <Button variant="outline" className="gap-2" onClick={onRegenerate} disabled={regenerating || uploading}>
                {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Regenerate
              </Button>
            )}
            {onUpload && (
              <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading || regenerating}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                Upload
              </Button>
            )}
            {onSave && (
              <Button variant="outline" className="gap-2" onClick={onSave} disabled={saving || !hasUnsavedChanges}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
            />
          </div>
        </div>
        {secondaryCustomUrl && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{secondaryLabel}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className={`flex-1 rounded-lg bg-muted/50 flex items-center justify-center min-h-[120px] p-6 ${previewClassName}`}>
                <img src={secondaryCustomUrl} alt={secondaryLabel} className="max-w-full max-h-[160px] object-contain" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:w-36 shrink-0">
                <Button className="bg-black text-white hover:bg-black/80 gap-2" onClick={onDownloadSecondary} disabled={uploading || regenerating}>
                  <Download className="w-4 h-4" /> PNG
                </Button>
              </div>
            </div>
          </div>
        )}
        {onRegenerateDescriptionChange && (
          <div className="mt-4 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Describe how you want this to regenerate</Label>
            <Textarea
              value={regenerateDescription}
              onChange={(e) => onRegenerateDescriptionChange(e.target.value)}
              placeholder={`e.g., A minimalist heart icon with a pink-to-red gradient, clean and modern`}
              className="text-sm resize-none"
              rows={2}
            />
            <p className="text-xs text-muted-foreground/70">Leave empty to regenerate the default SVG. Enter a description to generate a custom image with AI.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}