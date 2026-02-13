import { useState } from "react";
import { ShieldAlert, ShieldCheck, Eye, EyeOff } from "lucide-react";

interface SafeZone {
  top: number;    // percentage
  bottom: number;
  left: number;
  right: number;
}

// Meta ad safe zones per format (percentages of the frame covered by UI)
const SAFE_ZONES: Record<string, SafeZone> = {
  // 9:16 Reels: top 14%, bottom 35%, sides 6%
  "story": { top: 14, bottom: 35, left: 6, right: 6 },
  // 4:5 Portrait: top 0%, bottom ~15% (CTA area), sides ~5%
  "portrait": { top: 0, bottom: 15, left: 5, right: 5 },
  // 1:1 Feed: top 0%, bottom ~10%, sides ~5%
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
    <>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
        aria-label="Toggle safe zones"
      >
        {visible ? (
          <EyeOff className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        Safe zones
      </button>

      {visible && (
        <>
          {/* Top zone */}
          {zone.top > 0 && (
            <div
              className="absolute top-0 left-0 right-0 z-10 border-b border-dashed border-red-400/80 bg-red-500/20 pointer-events-none"
              style={{ height: `${zone.top}%` }}
            >
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-red-300 whitespace-nowrap">
                {zone.top}% UI overlay
              </span>
            </div>
          )}

          {/* Bottom zone */}
          {zone.bottom > 0 && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10 border-t border-dashed border-red-400/80 bg-red-500/20 pointer-events-none"
              style={{ height: `${zone.bottom}%` }}
            >
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-medium text-red-300 whitespace-nowrap">
                {zone.bottom}% UI overlay
              </span>
            </div>
          )}

          {/* Left zone */}
          {zone.left > 0 && (
            <div
              className="absolute top-0 bottom-0 left-0 z-10 border-r border-dashed border-amber-400/60 bg-amber-500/10 pointer-events-none"
              style={{ width: `${zone.left}%` }}
            />
          )}

          {/* Right zone */}
          {zone.right > 0 && (
            <div
              className="absolute top-0 bottom-0 right-0 z-10 border-l border-dashed border-amber-400/60 bg-amber-500/10 pointer-events-none"
              style={{ width: `${zone.right}%` }}
            />
          )}

          {/* Safe area label */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] font-medium text-emerald-300">Safe area</span>
          </div>
        </>
      )}
    </>
  );
};

export default SafeZoneOverlay;
