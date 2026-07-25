import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, UploadCloud, Info, FileImage, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PLACEMENTS = [
  { width: 1200, height: 400, locations: [{ city: 'DeFuniak Springs', id: 'FL-275699' }, { city: 'Crestview', id: 'FL-275518' }] },
  { width: 1000, height: 400, locations: [{ city: 'Marianna', id: 'FL-12055' }] },
  { width: 1400, height: 400, locations: [{ city: 'Crestview', id: 'FL-275517' }, { city: 'Pensacola', id: 'FL-275520' }] },
];

function PlacementRow({ placement }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const res = await base44.functions.invoke('uploadToCloudinary', {
          file: base64,
          filename: file.name,
        });
        if (res.data?.url) {
          setPreview(res.data.url);
          toast.success('Billboard design uploaded');
        } else {
          toast.error(res.data?.error || 'Upload failed');
        }
        setUploading(false);
      };
      reader.onerror = () => { toast.error('Failed to read file'); setUploading(false); };
      reader.readAsDataURL(file);
    } catch (e) {
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm">{placement.width} x {placement.height} px • Landscape</span>
        {placement.locations.map((loc, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
            <MapPin className="w-3 h-3 text-destructive" />
            {loc.city} • {loc.id}
          </span>
        ))}
        {placement.locations.length > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            <Info className="w-3 h-3" /> + {placement.locations.length - 1} more location{placement.locations.length - 1 > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}
        style={{ aspectRatio: `${placement.width} / ${placement.height}`, maxHeight: '200px' }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        {preview ? (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img src={preview} alt="Billboard preview" className="max-w-full max-h-full object-contain rounded" />
            <Button size="icon" variant="secondary" className="absolute top-2 right-2 w-7 h-7" onClick={() => setPreview(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
            <UploadCloud className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Drag file here to upload your media</p>
            <p className="text-xs text-muted-foreground">or</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-primary border-primary/30" onClick={() => inputRef.current?.click()}>
                <FileImage className="w-3.5 h-3.5" /> Upload from computer
              </Button>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export default function BillboardPlacements() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Billboard placements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {PLACEMENTS.map((p, i) => (
          <PlacementRow key={i} placement={p} />
        ))}
      </CardContent>
    </Card>
  );
}