import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileCode, Loader2, Star, FileJson, RefreshCw, UploadCloud, Save } from 'lucide-react';
import { toast } from 'sonner';
import { generateAppIcon, downloadIco, downloadSvg, svgToPngBlob, generateWebManifest, svgToDataUrl } from '@/lib/logoAssets';

const FAVICON_PNG_SIZES = [
  { label: '16×16', size: 16, file: 'favicon-16.png' },
  { label: '32×32', size: 32, file: 'favicon-32.png' },
  { label: '180×180 (Apple)', size: 180, file: 'apple-touch-icon.png' },
  { label: '192×192 (Android)', size: 192, file: 'favicon-192.png' },
  { label: '512×512 (Android)', size: 512, file: 'favicon-512.png' },
];

export default function FaviconGenerator({
  siteName,
  customUrl,
  onRegenerate,
  onUpload,
  onSave,
  regenerating = false,
  uploading = false,
  saving = false,
  regenerateDescription = '',
  onRegenerateDescriptionChange,
  applyToExisting = false,
  onApplyToExistingChange,
  hasUnsavedChanges = false,
}) {
  const fileInputRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const iconSvg = generateAppIcon(siteName);
  const hasCustom = !!customUrl;
  const previewUrl = customUrl || svgToDataUrl(iconSvg);

  const downloadCustomPng = async (url, size, file) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      await new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, size, size);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) { reject(new Error('Failed')); return; }
            const dlUrl = URL.createObjectURL(pngBlob);
            const a = document.createElement('a');
            a.href = dlUrl;
            a.download = file;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(dlUrl);
            resolve();
          }, 'image/png');
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleIco = async () => {
    setBusy('ico');
    try {
      await downloadIco(iconSvg, [16, 32, 48]);
      toast.success('favicon.ico downloaded');
    } catch (e) {
      toast.error(e.message || 'Failed to generate ICO');
    } finally {
      setBusy(null);
    }
  };

  const handlePng = async (size, file) => {
    setBusy(`png-${size}`);
    try {
      if (hasCustom) {
        await downloadCustomPng(customUrl, size, file);
      } else {
        const blob = await svgToPngBlob(iconSvg, size, size);
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = file;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(dlUrl);
      }
      toast.success(`${file} downloaded`);
    } catch (e) {
      toast.error(e.message || 'Failed to generate PNG');
    } finally {
      setBusy(null);
    }
  };

  const handleSvg = () => {
    downloadSvg(iconSvg, `${slug}-favicon.svg`);
    toast.success('favicon.svg downloaded');
  };

  const handleManifest = () => {
    const json = generateWebManifest(siteName);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site.webmanifest';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('site.webmanifest downloaded');
  };

  const handleAll = async () => {
    setBusy('all');
    try {
      await downloadIco(iconSvg, [16, 32, 48]);
      for (const s of FAVICON_PNG_SIZES) {
        if (hasCustom) {
          await downloadCustomPng(customUrl, s.size, s.file);
        } else {
          const blob = await svgToPngBlob(iconSvg, s.size, s.size);
          const dlUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = dlUrl;
          a.download = s.file;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(dlUrl);
        }
      }
      const json = generateWebManifest(siteName);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'site.webmanifest';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('All favicon assets downloaded');
    } catch (e) {
      toast.error(e.message || 'Failed to generate all assets');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Favicon Generator</CardTitle>
            <CardDescription className="text-sm">
              Generate favicon.ico, multi-size PNGs, SVG, and a web manifest. Enter a description below to design a custom favicon with AI.
            </CardDescription>
          </div>
          {hasCustom && (
            <span className="text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium shrink-0">Custom</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-end gap-3">
            {[16, 32, 48, 180].map(s => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className="rounded bg-muted/50 p-1 flex items-center justify-center" style={{ width: s + 8, height: s + 8 }}>
                  {regenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : (
                    <img src={previewUrl} alt={`favicon ${s}`} style={{ width: s, height: s }} className="rounded-sm" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">{s}px</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="bg-black text-white hover:bg-black/80 gap-2" onClick={handleIco} disabled={!!busy || regenerating || uploading}>
            {busy === 'ico' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            favicon.ico
          </Button>
          {FAVICON_PNG_SIZES.map(s => (
            <Button key={s.size} variant="outline" className="gap-2" onClick={() => handlePng(s.size, s.file)} disabled={!!busy || regenerating || uploading}>
              {busy === `png-${s.size}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {s.label}
            </Button>
          ))}
          <Button variant="outline" className="gap-2" onClick={handleSvg} disabled={!!busy || regenerating}>
            <FileCode className="w-4 h-4" /> SVG
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleManifest} disabled={!!busy}>
            <FileJson className="w-4 h-4" /> site.webmanifest
          </Button>
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

        {onRegenerateDescriptionChange && (
          <div className="space-y-1.5 pt-3 border-t">
            <Label className="text-xs text-muted-foreground">Describe how you want the favicon to look</Label>
            <Textarea
              value={regenerateDescription}
              onChange={(e) => onRegenerateDescriptionChange(e.target.value)}
              placeholder={`e.g., A minimalist heart icon with a pink-to-red gradient, clean and modern, centered on a rounded square`}
              className="text-sm resize-none"
              rows={2}
            />
            {hasCustom && (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="apply-existing-favicon"
                  checked={applyToExisting}
                  onCheckedChange={onApplyToExistingChange}
                />
                <Label htmlFor="apply-existing-favicon" className="text-xs text-muted-foreground cursor-pointer">
                  Apply to existing image (modify) instead of starting over
                </Label>
              </div>
            )}
            <p className="text-xs text-muted-foreground/70">{hasCustom && applyToExisting ? 'The description will be applied to your current favicon as a modification.' : 'Leave empty to reset to the default SVG. Enter a description to generate a custom favicon with AI.'}</p>
          </div>
        )}

        <div className="pt-3 border-t">
          <Button className="w-full gap-2" onClick={handleAll} disabled={!!busy || regenerating || uploading}>
            {busy === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download All Favicon Assets
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Upload these files to your app's public folder (favicon.ico, favicon-16.png, favicon-32.png, apple-touch-icon.png, favicon-192.png, favicon-512.png, site.webmanifest) and reference them in index.html.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}