import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileCode } from 'lucide-react';

export default function LogoAssetCard({ icon: Icon, title, description, previewUrl, onDownloadPng, onDownloadSvg, previewClassName = '' }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className={`flex-1 rounded-lg bg-muted/50 flex items-center justify-center min-h-[120px] p-6 ${previewClassName}`}>
            {previewUrl && <img src={previewUrl} alt={title} className="max-w-full max-h-[160px] object-contain" />}
          </div>
          <div className="flex flex-col gap-2 w-24 shrink-0">
            <Button className="bg-black text-white hover:bg-black/80 gap-2" onClick={onDownloadPng}>
              <Download className="w-4 h-4" /> PNG
            </Button>
            <Button variant="outline" className="gap-2" onClick={onDownloadSvg}>
              <FileCode className="w-4 h-4" /> SVG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}