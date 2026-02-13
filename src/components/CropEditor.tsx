import { useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import SafeZoneOverlay from "@/components/SafeZoneOverlay";
import type { FormatConfig, MediaType } from "@/lib/mediaUtils";

interface CropEditorProps {
  mediaSrc: string;
  mediaType: MediaType;
  format: FormatConfig;
  offsetX: number;
  offsetY: number;
  zoom: number;
  showSafeZones: boolean;
  fixedHeight?: boolean;
  onOffsetChange: (x: number, y: number) => void;
  onZoomChange: (zoom: number) => void;
}

const CropEditor = ({
  mediaSrc,
  mediaType,
  format,
  offsetX,
  offsetY,
  zoom,
  showSafeZones,
  fixedHeight,
  onOffsetChange,
  onZoomChange,
}: CropEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [mediaDims, setMediaDims] = useState({ w: 0, h: 0 });

  // Calculate the drawn size of the media at current zoom (in container pixels)
  const getDrawSize = useCallback(() => {
    if (!containerRef.current || mediaDims.w === 0) return { drawW: 0, drawH: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const srcRatio = mediaDims.w / mediaDims.h;
    const dstRatio = rect.width / rect.height;

    let baseW: number, baseH: number;
    if (srcRatio > dstRatio) {
      baseH = rect.height;
      baseW = rect.height * srcRatio;
    } else {
      baseW = rect.width;
      baseH = rect.width / srcRatio;
    }

    return { drawW: baseW * zoom, drawH: baseH * zoom };
  }, [mediaDims, zoom]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY };
      containerRef.current?.setPointerCapture(e.pointerId);
      containerRef.current?.focus();
    },
    [offsetX, offsetY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const { drawW, drawH } = getDrawSize();

      const overflowX = drawW - rect.width;
      const overflowY = drawH - rect.height;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      const newX = overflowX > 0
        ? Math.max(0, Math.min(1, dragStart.current.ox - dx / overflowX))
        : 0.5;
      const newY = overflowY > 0
        ? Math.max(0, Math.min(1, dragStart.current.oy - dy / overflowY))
        : 0.5;

      onOffsetChange(newX, newY);
    },
    [dragging, getDrawSize, onOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 0.05 : 0.01;
      let newX = offsetX;
      let newY = offsetY;
      switch (e.key) {
        case "ArrowLeft":  newX = Math.max(0, offsetX - step); break;
        case "ArrowRight": newX = Math.min(1, offsetX + step); break;
        case "ArrowUp":    newY = Math.max(0, offsetY - step); break;
        case "ArrowDown":  newY = Math.min(1, offsetY + step); break;
        default: return;
      }
      e.preventDefault();
      onOffsetChange(newX, newY);
    },
    [offsetX, offsetY, onOffsetChange]
  );

  // We use CSS transform to handle zoom + position instead of object-position
  // This gives us more control over scaling
  const getMediaStyle = (): React.CSSProperties => {
    if (!containerRef.current || mediaDims.w === 0) {
      return { objectFit: "cover", objectPosition: "center" };
    }

    const rect = containerRef.current.getBoundingClientRect();
    const srcRatio = mediaDims.w / mediaDims.h;
    const dstRatio = rect.width / rect.height;

    // Base cover size
    let baseW: number, baseH: number;
    if (srcRatio > dstRatio) {
      baseH = rect.height;
      baseW = rect.height * srcRatio;
    } else {
      baseW = rect.width;
      baseH = rect.width / srcRatio;
    }

    const scaledW = baseW * zoom;
    const scaledH = baseH * zoom;

    const overflowX = scaledW - rect.width;
    const overflowY = scaledH - rect.height;

    const tx = overflowX > 0 ? -offsetX * overflowX : (rect.width - scaledW) / 2;
    const ty = overflowY > 0 ? -offsetY * overflowY : (rect.height - scaledH) / 2;

    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: `${scaledW}px`,
      height: `${scaledH}px`,
      transform: `translate(${tx}px, ${ty}px)`,
      maxWidth: "none",
    };
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={containerRef}
        tabIndex={0}
        className={`relative overflow-hidden rounded-lg border-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          dragging ? "border-primary cursor-grabbing" : "border-border cursor-grab hover:border-primary/40"
        }`}
        style={fixedHeight ? { height: "450px" } : { aspectRatio: `${format.width}/${format.height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <SafeZoneOverlay formatId={format.id} visible={showSafeZones} />
        {mediaType === "image" ? (
          <img
            src={mediaSrc}
            alt="Preview"
            draggable={false}
            className="pointer-events-none select-none z-0"
            style={getMediaStyle()}
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
            className="pointer-events-none select-none z-0"
            style={getMediaStyle()}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setMediaDims({ w: v.videoWidth, h: v.videoHeight });
            }}
          />
        )}
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-2 px-1">
        <button type="button" onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))} className="p-0.5 rounded hover:bg-muted transition-colors cursor-pointer" aria-label="Zoom out">
          <ZoomOut className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
        <Slider
          min={0.5}
          max={3}
          step={0.05}
          value={[zoom]}
          onValueChange={([v]) => onZoomChange(v)}
          className="flex-1 [&_[role=slider]]:focus-visible:ring-0"
          tabIndex={-1}
          onFocus={(e) => {
            e.preventDefault();
            containerRef.current?.focus();
          }}
        />
        <button type="button" onClick={() => onZoomChange(Math.min(3, zoom + 0.1))} className="p-0.5 rounded hover:bg-muted transition-colors cursor-pointer" aria-label="Zoom in">
          <ZoomIn className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CropEditor;
