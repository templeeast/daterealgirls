import React, { useState, useEffect } from 'react';
import { Shield, AppWindow, StretchHorizontal, StretchVertical, Megaphone, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSiteConfig from '@/hooks/useSiteConfig';
import useMyProfile from '@/hooks/useMyProfile';
import LogoAssetCard from '@/components/admin/LogoAssetCard';
import {
  generateAppIcon,
  generateHorizontalLogo,
  generateVerticalLogo,
  generateBillboardLogo,
  downloadSvg,
  downloadPng,
  downloadFromUrl,
  downloadResizedImage,
  svgToDataUrl,
} from '@/lib/logoAssets';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const BILLBOARD_RESOLUTIONS = [
  { label: '1400 × 400', width: 1400, height: 400 },
  { label: '840 × 400', width: 840, height: 400 },
  { label: '1200 × 400', width: 1200, height: 400 },
  { label: '1710 × 330', width: 1710, height: 330 },
];

export default function LogoAssets() {
  const { user } = useMyProfile();
  const { config } = useSiteConfig();
  const [includeTagline, setIncludeTagline] = useState(true);
  const [customTagline, setCustomTagline] = useState(config?.tagline || 'Where Real Connections Begin');
  const [customAssets, setCustomAssets] = useState({});
  const [savedAssets, setSavedAssets] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [regenerateDescriptions, setRegenerateDescriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('logoAssetRegenerateDescriptions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [uploadingKey, setUploadingKey] = useState(null);
  const [regeneratingKey, setRegeneratingKey] = useState(null);
  const [assetsInitialized, setAssetsInitialized] = useState(false);
  const [savingTagline, setSavingTagline] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('logoAssetRegenerateDescriptions', JSON.stringify(regenerateDescriptions));
    } catch {}
  }, [regenerateDescriptions]);

  const [applyToExisting, setApplyToExisting] = useState({});

  useEffect(() => {
    if (config && !assetsInitialized) {
      try {
        const parsed = config.saved_logo_assets ? JSON.parse(config.saved_logo_assets) : {};
        setCustomAssets(parsed);
        setSavedAssets(parsed);
      } catch {}
      setAssetsInitialized(true);
    }
  }, [config, assetsInitialized]);

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

  const handleUpload = async (key, file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setUploadingKey(key);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
      const res = await base44.functions.invoke('uploadToCloudinary', { file: base64, filename: file.name });
      if (res.data?.url) {
        setCustomAssets(prev => ({ ...prev, [key]: res.data.url }));
        toast.success('Asset uploaded');
      } else {
        toast.error(res.data?.error || 'Upload failed');
      }
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRegenerate = async (key, description, useExisting) => {
    setRegeneratingKey(key);
    try {
      if (description?.trim()) {
        const assetLabels = { appIcon: 'square app icon', horizontal: 'horizontal logo', vertical: 'vertical logo', billboard: 'billboard advertisement' };
        const basePrompt = `for ${siteName}, a dating platform. ${description.trim()}. Use pink/red primary color (#e32652) with dark navy (#1a1a2e) and white. High quality, clean, modern design.`;

        if (key === 'billboard') {
          const rawPrompt = `A professional billboard advertisement graphic — FLAT 2D design only, NO physical billboard, NO pole, NO street, NO frame, just the advertisement image itself. IMPORTANT: This image will be cropped to a wide banner (1400×400 pixels). Place ALL content — logo, text, graphics, call-to-action — in a horizontal band across the CENTER of the image, occupying only the middle 35% vertically. The top and bottom portions must be solid dark background only — no content there. Spread all content horizontally across the full width of the image, edge to edge. ${basePrompt}`;
          const contextPrompt = `Display this exact advertisement graphic on a large roadside billboard at night in a city setting ${basePrompt}`;
          const existingUrl = useExisting ? customAssets.billboard : null;
          const rawRes = await base44.integrations.Core.GenerateImage({
            prompt: rawPrompt,
            ...(existingUrl ? { existing_image_urls: [existingUrl] } : {}),
          });
          if (rawRes.url) {
            setCustomAssets(prev => ({ ...prev, billboard: rawRes.url }));
            const contextRes = await base44.integrations.Core.GenerateImage({ prompt: contextPrompt, existing_image_urls: [rawRes.url] });
            if (contextRes.url) {
              setCustomAssets(prev => ({ ...prev, billboard_context: contextRes.url }));
            }
            toast.success('Billboard assets regenerated with AI');
          } else {
            toast.error('Failed to generate image');
          }
        } else {
          const prompt = `A professional ${assetLabels[key] || 'branding asset'} ${basePrompt}`;
          const existingUrl = useExisting ? customAssets[key] : null;
          const res = await base44.integrations.Core.GenerateImage({
            prompt,
            ...(existingUrl ? { existing_image_urls: [existingUrl] } : {}),
          });
          if (res.url) {
            setCustomAssets(prev => ({ ...prev, [key]: res.url }));
            toast.success('Asset regenerated with AI');
          } else {
            toast.error('Failed to generate image');
          }
        }
      } else {
        setCustomAssets(prev => {
          const next = { ...prev };
          delete next[key];
          if (key === 'billboard') delete next.billboard_context;
          return next;
        });
        toast.success('Reset to default SVG');
      }
    } catch (e) {
      toast.error(e.message || 'Regeneration failed');
    } finally {
      setRegeneratingKey(null);
    }
  };

  const updateDescription = (key, val) => {
    setRegenerateDescriptions(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key) => {
    if (!config?.id) return;
    setSavingKey(key);
    try {
      const newSaved = { ...savedAssets };
      if (customAssets[key]) {
        newSaved[key] = customAssets[key];
      } else {
        delete newSaved[key];
      }
      if (key === 'billboard') {
        if (customAssets.billboard_context) {
          newSaved.billboard_context = customAssets.billboard_context;
        } else {
          delete newSaved.billboard_context;
        }
      }
      await base44.entities.SiteConfig.update(config.id, { saved_logo_assets: JSON.stringify(newSaved) });
      setSavedAssets({ ...newSaved });
      toast.success('Asset saved — will appear on next page load');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingKey(null);
    }
  };

  const hasUnsavedChanges = (key) => (customAssets[key] || null) !== (savedAssets[key] || null);

  const handleSaveTagline = async () => {
    if (!config?.id) return;
    setSavingTagline(true);
    try {
      await base44.entities.SiteConfig.update(config.id, { tagline: customTagline });
      toast.success('Tagline saved — will appear on next page load');
    } catch (e) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSavingTagline(false);
    }
  };

  const makePngHandler = (key, svgString, filename, defaultW, defaultH) => {
    return async (w, h) => {
      const customUrl = customAssets[key];
      if (customUrl) {
        downloadFromUrl(customUrl, filename);
      } else {
        await handlePng(svgString, filename, w || defaultW, h || defaultH);
      }
    };
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
          customUrl={customAssets.appIcon}
          previewClassName="rounded-xl"
          onDownloadPng={makePngHandler('appIcon', appIconSvg, `${slug}-icon.png`, 512, 512)}
          onDownloadSvg={() => downloadSvg(appIconSvg, `${slug}-icon.svg`)}
          onRegenerate={() => handleRegenerate('appIcon', regenerateDescriptions.appIcon, applyToExisting.appIcon)}
          onUpload={(file) => handleUpload('appIcon', file)}
          uploading={uploadingKey === 'appIcon'}
          regenerating={regeneratingKey === 'appIcon'}
          regenerateDescription={regenerateDescriptions.appIcon || ''}
          onRegenerateDescriptionChange={(val) => updateDescription('appIcon', val)}
          applyToExisting={applyToExisting.appIcon || false}
          onApplyToExistingChange={(checked) => setApplyToExisting(prev => ({ ...prev, appIcon: checked }))}
          onSave={() => handleSave('appIcon')}
          hasUnsavedChanges={hasUnsavedChanges('appIcon')}
          saving={savingKey === 'appIcon'}
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
              <div className="flex gap-2">
                <Input
                  id="custom-tagline"
                  value={customTagline}
                  onChange={(e) => setCustomTagline(e.target.value)}
                  disabled={!includeTagline}
                  placeholder="Enter your tagline"
                />
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={handleSaveTagline}
                  disabled={savingTagline || !includeTagline || !config || customTagline === config?.tagline}
                >
                  {savingTagline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <LogoAssetCard
          icon={StretchHorizontal}
          title="Horizontal Logo"
          description="Best for website headers and wide spaces."
          previewUrl={svgToDataUrl(horizontalSvg)}
          customUrl={customAssets.horizontal}
          onDownloadPng={makePngHandler('horizontal', horizontalSvg, `${slug}-horizontal.png`, 400, 80)}
          onDownloadSvg={() => downloadSvg(horizontalSvg, `${slug}-horizontal.svg`)}
          onRegenerate={() => handleRegenerate('horizontal', regenerateDescriptions.horizontal, applyToExisting.horizontal)}
          onUpload={(file) => handleUpload('horizontal', file)}
          uploading={uploadingKey === 'horizontal'}
          regenerating={regeneratingKey === 'horizontal'}
          regenerateDescription={regenerateDescriptions.horizontal || ''}
          onRegenerateDescriptionChange={(val) => updateDescription('horizontal', val)}
          applyToExisting={applyToExisting.horizontal || false}
          onApplyToExistingChange={(checked) => setApplyToExisting(prev => ({ ...prev, horizontal: checked }))}
          onSave={() => handleSave('horizontal')}
          hasUnsavedChanges={hasUnsavedChanges('horizontal')}
          saving={savingKey === 'horizontal'}
        />

        <LogoAssetCard
          icon={StretchVertical}
          title="Vertical Logo"
          description="Useful for stacked layouts or square-like spaces."
          previewUrl={svgToDataUrl(verticalSvg)}
          customUrl={customAssets.vertical}
          onDownloadPng={makePngHandler('vertical', verticalSvg, `${slug}-vertical.png`, 260, 160)}
          onDownloadSvg={() => downloadSvg(verticalSvg, `${slug}-vertical.svg`)}
          onRegenerate={() => handleRegenerate('vertical', regenerateDescriptions.vertical, applyToExisting.vertical)}
          onUpload={(file) => handleUpload('vertical', file)}
          uploading={uploadingKey === 'vertical'}
          regenerating={regeneratingKey === 'vertical'}
          regenerateDescription={regenerateDescriptions.vertical || ''}
          onRegenerateDescriptionChange={(val) => updateDescription('vertical', val)}
          applyToExisting={applyToExisting.vertical || false}
          onApplyToExistingChange={(checked) => setApplyToExisting(prev => ({ ...prev, vertical: checked }))}
          onSave={() => handleSave('vertical')}
          hasUnsavedChanges={hasUnsavedChanges('vertical')}
          saving={savingKey === 'vertical'}
        />

        <LogoAssetCard
          icon={Megaphone}
          title="Billboard Logo"
          description="Large format for electronic billboards and digital displays. Generates two images: the raw graphic and an on-billboard mockup."
          previewUrl={svgToDataUrl(billboardSvg)}
          customUrl={customAssets.billboard}
          previewClassName="min-h-[100px]"
          resolutions={BILLBOARD_RESOLUTIONS}
          onDownloadPng={async (w, h) => {
            const customUrl = customAssets.billboard;
            if (customUrl) {
              try {
                await downloadResizedImage(customUrl, `${slug}-billboard-${w}x${h}.png`, w, h);
              } catch {
                toast.error('Failed to generate PNG at target size');
              }
            } else {
              const svg = generateBillboardLogo(siteName, tagline, includeTagline, w, h);
              await handlePng(svg, `${slug}-billboard-${w}x${h}.png`, w, h);
            }
          }}
          onDownloadSvg={() => downloadSvg(billboardSvg, `${slug}-billboard.svg`)}
          onRegenerate={() => handleRegenerate('billboard', regenerateDescriptions.billboard, applyToExisting.billboard)}
          onUpload={(file) => handleUpload('billboard', file)}
          uploading={uploadingKey === 'billboard'}
          regenerating={regeneratingKey === 'billboard'}
          regenerateDescription={regenerateDescriptions.billboard || ''}
          onRegenerateDescriptionChange={(val) => updateDescription('billboard', val)}
          applyToExisting={applyToExisting.billboard || false}
          onApplyToExistingChange={(checked) => setApplyToExisting(prev => ({ ...prev, billboard: checked }))}
          onSave={() => handleSave('billboard')}
          hasUnsavedChanges={hasUnsavedChanges('billboard')}
          saving={savingKey === 'billboard'}
          secondaryCustomUrl={customAssets.billboard_context}
          secondaryLabel="On Billboard (Mockup)"
          onDownloadSecondary={() => downloadFromUrl(customAssets.billboard_context, `${slug}-billboard-on-billboard.png`)}
        />
      </div>
    </div>
  );
}