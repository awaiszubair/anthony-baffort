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
      {zone.top > 0 && (
        <div
          className="absolute top-0 left-0 right-0 bg-black/40 border-b border-dashed border-white/40"
          style={{ height: `${zone.top}%` }}
        />
      )}

      {zone.bottom > 0 && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/40 border-t border-dashed border-white/40"
          style={{ height: `${zone.bottom}%` }}
        />
      )}

      {zone.left > 0 && (
        <div
          className="absolute left-0 bg-black/25 border-r border-dashed border-white/30"
          style={{
            width: `${zone.left}%`,
            top: `${zone.top}%`,
            bottom: `${zone.bottom}%`,
          }}
        />
      )}

      {zone.right > 0 && (
        <div
          className="absolute right-0 bg-black/25 border-l border-dashed border-white/30"
          style={{
            width: `${zone.right}%`,
            top: `${zone.top}%`,
            bottom: `${zone.bottom}%`,
          }}
        />
      )}
    </div>
  );
};

export default SafeZoneOverlay;
