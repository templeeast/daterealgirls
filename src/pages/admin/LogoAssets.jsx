import React, { useState } from 'react';
import { Shield, AppWindow, StretchHorizontal, StretchVertical, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import LogoAssetCard from '@/components/admin/LogoAssetCard';
import BillboardPlacements from '@/components/admin/BillboardPlacements';
import {
  generateAppIcon,
  generateHorizontalLogo,
  generateVerticalLogo,
  generateBillboardLogo,
  downloadSvg,
  downloadPng,
  svgToDataUrl,
} from '@/lib/logoAssets';
import { toast } from 'sonner';

export default function LogoAssets() {
  const { user } = useMyProfile();
  const { config } = useSiteConfig();
  const [includeTagline, setIncludeTagline] = useState(true);
  const [customTagline, setCustomTagline] = useState(config?.tagline || 'Where Real Connections Begin');

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-lg">Access denied. Admin only.</p>
      </div>
    );
  }

  const siteName = config?.site_name || 'DateRealGirls.com';
  const tagline = includeTagline ? customTagline : '';
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const handlePng = async (svgString, filename, w, h) => {
    try {
      await downloadPng(svgString, filename, w, h);
    } catch {
      toast.error('Failed to generate PNG');
    }
  };

  const appIconSvg = generateAppIcon(siteName);
  const horizontalSvg = generateHorizontalLogo(siteName, tagline, includeTagline);
  const verticalSvg = generateVerticalLogo(siteName, tagline, includeTagline);
  const billboardSvg = generateBillboardLogo(siteName, tagline, includeTagline);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Download Logo & Branding Assets</h1>
        <p className="text-muted-foreground mt-1">
          Get the official {siteName} icon and logos for your marketing materials.
        </p>
      </div>

      <div className="space-y-6">
        <LogoAssetCard
          icon={AppWindow}
          title="App Icon"
          description="A square icon, perfect for social media profiles and app store listings."
          previewUrl={svgToDataUrl(appIconSvg)}
          previewClassName="rounded-xl"
          onDownloadPng={() => handlePng(appIconSvg, `${slug}-icon.png`, 512, 512)}
          onDownloadSvg={() => downloadSvg(appIconSvg, `${slug}-icon.svg`)}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <StretchHorizontal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Logo Settings</CardTitle>
                <CardDescription className="text-sm">Customize the logos with text before downloading.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="tagline-toggle">Include Tagline</Label>
              <Switch id="tagline-toggle" checked={includeTagline} onCheckedChange={setIncludeTagline} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-tagline">Custom Tagline</Label>
              <Input
                id="custom-tagline"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
                disabled={!includeTagline}
                placeholder="Enter your tagline"
              />
            </div>
          </CardContent>
        </Card>

        <LogoAssetCard
          icon={StretchHorizontal}
          title="Horizontal Logo"
          description="Best for website headers and wide spaces."
          previewUrl={svgToDataUrl(horizontalSvg)}
          onDownloadPng={() => handlePng(horizontalSvg, `${slug}-horizontal.png`, 400, 80)}
          onDownloadSvg={() => downloadSvg(horizontalSvg, `${slug}-horizontal.svg`)}
        />

        <LogoAssetCard
          icon={StretchVertical}
          title="Vertical Logo"
          description="Useful for stacked layouts or square-like spaces."
          previewUrl={svgToDataUrl(verticalSvg)}
          onDownloadPng={() => handlePng(verticalSvg, `${slug}-vertical.png`, 260, 160)}
          onDownloadSvg={() => downloadSvg(verticalSvg, `${slug}-vertical.svg`)}
        />

        <LogoAssetCard
          icon={Megaphone}
          title="Billboard Logo"
          description="Large format for electronic billboards and digital displays (1400x400px)."
          previewUrl={svgToDataUrl(billboardSvg)}
          previewClassName="min-h-[100px]"
          onDownloadPng={() => handlePng(billboardSvg, `${slug}-billboard.png`, 1400, 400)}
          onDownloadSvg={() => downloadSvg(billboardSvg, `${slug}-billboard.svg`)}
        />
      </div>

      <BillboardPlacements />
    </div>
  );
}