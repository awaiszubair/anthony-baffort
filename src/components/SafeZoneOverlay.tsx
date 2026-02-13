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
  const zone = SAFE_ZONES[formatId];
  if (!zone) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
      {/* Top safe line */}
      {zone.top > 0 && (
        <div
          className="absolute left-0 right-0 border-b border-dashed border-white/30"
          style={{ top: `${zone.top}%` }}
        />
      )}

      {/* Bottom safe line */}
      {zone.bottom > 0 && (
        <div
          className="absolute left-0 right-0 border-t border-dashed border-white/30"
          style={{ bottom: `${zone.bottom}%` }}
        />
      )}

      {/* Left safe line */}
      {zone.left > 0 && (
        <div
          className="absolute top-0 bottom-0 border-r border-dashed border-white/20"
          style={{ left: `${zone.left}%` }}
        />
      )}

      {/* Right safe line */}
      {zone.right > 0 && (
        <div
          className="absolute top-0 bottom-0 border-l border-dashed border-white/20"
          style={{ right: `${zone.right}%` }}
        />
      )}
    </div>
  );
};

export default SafeZoneOverlay;
