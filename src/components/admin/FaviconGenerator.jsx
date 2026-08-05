import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileCode, Loader2, Star, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { generateAppIcon, downloadIco, downloadPng, downloadSvg, svgToPngBlob, generateWebManifest, svgToDataUrl } from '@/lib/logoAssets';

const FAVICON_PNG_SIZES = [
  { label: '16×16', size: 16, file: 'favicon-16.png' },
  { label: '32×32', size: 32, file: 'favicon-32.png' },
  { label: '180×180 (Apple)', size: 180, file: 'apple-touch-icon.png' },
  { label: '192×192 (Android)', size: 192, file: 'favicon-192.png' },
  { label: '512×512 (Android)', size: 512, file: 'favicon-512.png' },
];

export default function FaviconGenerator({ siteName, customAppIconUrl }) {
  const [busy, setBusy] = useState(null);
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const iconSvg = generateAppIcon(siteName);

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
      if (customAppIconUrl) {
        const res = await fetch(customAppIconUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
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
            img.src = url;
          });
        } finally {
          URL.revokeObjectURL(url);
        }
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
        await handlePngQuiet(s.size, s.file);
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

  const handlePngQuiet = async (size, file) => {
    if (customAppIconUrl) {
      const res = await fetch(customAppIconUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
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
          img.src = url;
        });
      } finally {
        URL.revokeObjectURL(url);
      }
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
  };

  const previewUrl = customAppIconUrl || svgToDataUrl(iconSvg);

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
              Generate favicon.ico, multi-size PNGs, SVG, and a web manifest for browser tabs, bookmarks, and PWA install.
            </CardDescription>
          </div>
          {customAppIconUrl && (
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
                  <img src={previewUrl} alt={`favicon ${s}`} style={{ width: s, height: s }} className="rounded-sm" />
                </div>
                <span className="text-[10px] text-muted-foreground">{s}px</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="bg-black text-white hover:bg-black/80 gap-2" onClick={handleIco} disabled={!!busy}>
            {busy === 'ico' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            favicon.ico
          </Button>
          {FAVICON_PNG_SIZES.map(s => (
            <Button key={s.size} variant="outline" className="gap-2" onClick={() => handlePng(s.size, s.file)} disabled={!!busy}>
              {busy === `png-${s.size}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {s.label}
            </Button>
          ))}
          <Button variant="outline" className="gap-2" onClick={handleSvg} disabled={!!busy}>
            <FileCode className="w-4 h-4" /> SVG
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleManifest} disabled={!!busy}>
            <FileJson className="w-4 h-4" /> site.webmanifest
          </Button>
        </div>

        <div className="pt-3 border-t">
          <Button className="w-full gap-2" onClick={handleAll} disabled={!!busy}>
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