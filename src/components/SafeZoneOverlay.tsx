import { useState } from "react";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

interface SafeZone {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SAFE_ZONES: Record<string, SafeZone> = {
  "story": { top: 14, bottom: 35, left: 6, right: 6 },
  "portrait": { top: 0, bottom: 15, left: 5, right: 5 },
  "square": { top: 0, bottom: 10, left: 5, right: 5 },
};

interface SafeZoneOverlayProps {
  formatId: string;
}

const SafeZoneOverlay = ({ formatId }: SafeZoneOverlayProps) => {
  const [visible, setVisible] = useState(false);
  const zone = SAFE_ZONES[formatId];

  if (!zone) return null;

  return (
    <div className="absolute inset-0" style={{ zIndex: 30 }}>
      {/* Toggle button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible((v) => !v);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
        aria-label="Toggle safe zones"
      >
        {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        Safe zones
      </button>

      {visible && (
        <div className="absolute inset-0 pointer-events-none">
          {zone.top > 0 && (
            <div
              className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-red-400 bg-red-500/25"
              style={{ height: `${zone.top}%` }}
            >
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-red-300 whitespace-nowrap">
                {zone.top}% UI overlay
              </span>
            </div>
          )}

          {zone.bottom > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-red-400 bg-red-500/25"
              style={{ height: `${zone.bottom}%` }}
            >
              <span className="absolute top-1 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-red-300 whitespace-nowrap">
                {zone.bottom}% UI overlay
              </span>
            </div>
          )}

          {zone.left > 0 && (
            <div
              className="absolute top-0 bottom-0 left-0 border-r border-dashed border-amber-400/70 bg-amber-500/15"
              style={{ width: `${zone.left}%` }}
            />
          )}

          {zone.right > 0 && (
            <div
              className="absolute top-0 bottom-0 right-0 border-l border-dashed border-amber-400/70 bg-amber-500/15"
              style={{ width: `${zone.right}%` }}
            />
          )}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 rounded bg-black/60 px-2 py-1 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-semibold text-emerald-300">Safe area</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafeZoneOverlay;
