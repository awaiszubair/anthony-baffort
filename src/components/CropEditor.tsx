import { useRef, useState, useCallback, useEffect } from "react";
import type { FormatConfig, MediaType } from "@/lib/mediaUtils";

interface CropEditorProps {
  mediaSrc: string;
  mediaType: MediaType;
  format: FormatConfig;
  offsetX: number;
  offsetY: number;
  onOffsetChange: (x: number, y: number) => void;
}

const CropEditor = ({
  mediaSrc,
  mediaType,
  format,
  offsetX,
  offsetY,
  onOffsetChange,
}: CropEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [mediaDims, setMediaDims] = useState({ w: 0, h: 0 });

  const aspectRatio = format.width / format.height;

  // Calculate how the media scales inside the container (cover mode)
  const getOverflow = useCallback(() => {
    if (!containerRef.current || mediaDims.w === 0) return { x: 0, y: 0 };
    const container = containerRef.current.getBoundingClientRect();
    const srcRatio = mediaDims.w / mediaDims.h;
    const dstRatio = container.width / container.height;

    let drawW: number, drawH: number;
    if (srcRatio > dstRatio) {
      drawH = container.height;
      drawW = container.height * srcRatio;
    } else {
      drawW = container.width;
      drawH = container.width / srcRatio;
    }

    return {
      x: drawW - container.width,
      y: drawH - container.height,
    };
  }, [mediaDims]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [offsetX, offsetY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const overflow = getOverflow();
      if (overflow.x === 0 && overflow.y === 0) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      const newX =
        overflow.x > 0
          ? Math.max(0, Math.min(1, dragStart.current.ox - dx / overflow.x))
          : 0.5;
      const newY =
        overflow.y > 0
          ? Math.max(0, Math.min(1, dragStart.current.oy - dy / overflow.y))
          : 0.5;

      onOffsetChange(newX, newY);
    },
    [dragging, getOverflow, onOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Convert offset to object-position percentage
  const objectPosition = `${offsetX * 100}% ${offsetY * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
        dragging ? "border-primary cursor-grabbing" : "border-border cursor-grab hover:border-primary/40"
      }`}
      style={{ aspectRatio: `${format.width}/${format.height}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {mediaType === "image" ? (
        <img
          src={mediaSrc}
          alt="Preview"
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{ objectPosition }}
          onLoad={(e) => {
            const img = e.currentTarget;
            setMediaDims({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
      ) : (
        <video
          src={mediaSrc}
          muted
          loop
          autoPlay
          playsInline
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{ objectPosition }}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setMediaDims({ w: v.videoWidth, h: v.videoHeight });
          }}
        />
      )}

      {/* Drag hint overlay */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2 opacity-60">
        <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          ↕ Sleep om te herpositioneren
        </span>
      </div>
    </div>
  );
};

export default CropEditor;
