'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  imageUri: string;
  onClose: () => void;
}

export function ImageViewer({ imageUri, onClose }: ImageViewerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>
      
      <img
        src={imageUri}
        alt="查看大图"
        className={cn(
          'max-w-[90vw] max-h-[90vh] object-contain',
          'animate-in fade-in zoom-in-95 duration-300'
        )}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
