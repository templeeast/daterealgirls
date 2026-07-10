import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PhotoZoomModal({ photos, initialIndex, open, onOpenChange }) {
  const [index, setIndex] = useState(initialIndex ?? 0);

  useEffect(() => {
    if (open) setIndex(initialIndex ?? 0);
  }, [open, initialIndex]);

  if (!photos || photos.length === 0) return null;

  const prev = (e) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + photos.length) % photos.length);
  };
  const next = (e) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % photos.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
        <DialogTitle className="sr-only">Photo</DialogTitle>
        <div className="relative flex items-center justify-center">
          <img
            src={photos[index]}
            alt=""
            className="max-h-[80vh] max-w-full object-contain"
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {index + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}