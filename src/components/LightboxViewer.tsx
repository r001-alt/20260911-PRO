import { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

interface LightboxProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export function LightboxViewer({ imageUrl, title, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  return (
    <div
      id="lightbox-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-[#0A0A0F]/95 backdrop-blur-md select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Lightbox Toolbar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.08] bg-[#12121A]/80 text-[#FAFAFA]">
        <div className="flex items-center space-x-3">
          <span className="font-medium text-zinc-200 truncate max-w-md font-display">{title}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-amber-400 border border-white/[0.08]">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="lightbox-zoom-out"
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="縮小"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            id="lightbox-zoom-in"
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            id="lightbox-rotate"
            type="button"
            onClick={handleRotate}
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="順時針旋轉 90°"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <a
            id="lightbox-download"
            href={imageUrl}
            download={title}
            target="_blank"
            rel="noreferrer"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            title="下載圖片"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            id="lightbox-close"
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/[0.06] rounded-lg transition-colors ml-2"
            title="關閉 (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Image Canvas Container */}
      <div
        className="flex-1 flex items-center justify-center p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          id="lightbox-main-image"
          src={imageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          className="max-h-[85vh] max-w-[90vw] object-contain transition-transform duration-200 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-xl border border-white/[0.08]"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
