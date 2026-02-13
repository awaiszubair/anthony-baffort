import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music, Plus, Search, Home, PlaySquare, User } from "lucide-react";

interface PlatformOverlayProps {
  formatId: string;
  visible: boolean;
}

const PlatformOverlay = ({ formatId, visible }: PlatformOverlayProps) => {
  if (!visible) return null;

  if (formatId === "story") return <StoryReelOverlay />;
  if (formatId === "portrait" || formatId === "square") return <FeedOverlay />;
  return null;
};

/** Fake profile circle */
const Avatar = ({ size = 28 }: { size?: number }) => (
  <div
    className="rounded-full bg-white/30 border border-white/40 shrink-0"
    style={{ width: size, height: size }}
  />
);

/** Placeholder text bar */
const TextBar = ({ w = "60%" }: { w?: string }) => (
  <div className="h-[6px] rounded-full bg-white/30" style={{ width: w }} />
);

// ─── Instagram Feed Post overlay (1:1 & 4:5) ───────────────────────────
const FeedOverlay = () => (
  <div className="absolute inset-0 pointer-events-none flex flex-col justify-between" style={{ zIndex: 20 }}>
    {/* Top bar: avatar + username + more */}
    <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
      <Avatar size={24} />
      <TextBar w="30%" />
      <div className="ml-auto">
        <MoreHorizontal className="h-4 w-4 text-white/40" />
      </div>
    </div>

    {/* Bottom: actions + caption */}
    <div className="px-3 pb-2.5 space-y-2">
      {/* Action row */}
      <div className="flex items-center gap-3">
        <Heart className="h-[18px] w-[18px] text-white/40" />
        <MessageCircle className="h-[18px] w-[18px] text-white/40" />
        <Send className="h-[18px] w-[18px] text-white/40" />
        <div className="ml-auto">
          <Bookmark className="h-[18px] w-[18px] text-white/40" />
        </div>
      </div>
      {/* Likes + caption placeholder */}
      <div className="space-y-1">
        <TextBar w="20%" />
        <div className="flex items-center gap-1.5">
          <TextBar w="22%" />
          <TextBar w="50%" />
        </div>
      </div>
    </div>
  </div>
);

// ─── Instagram Story / Reel overlay (9:16) ──────────────────────────────
const StoryReelOverlay = () => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
    {/* Top zone (within top 14%) */}
    <div className="absolute left-0 right-0 top-0 flex items-center gap-2 px-3" style={{ height: "14%", paddingTop: "4%" }}>
      <Avatar size={26} />
      <div className="space-y-1 flex-1">
        <TextBar w="25%" />
      </div>
      <MoreHorizontal className="h-4 w-4 text-white/40" />
    </div>

    {/* Bottom zone (within bottom 35%) */}
    <div className="absolute left-0 right-0 bottom-0 flex flex-col justify-end" style={{ height: "35%" }}>
      {/* Caption + actions */}
      <div className="flex items-end gap-2 px-3 pb-2">
        {/* Left: caption area */}
        <div className="flex-1 space-y-1.5 pb-1">
          <div className="flex items-center gap-1.5">
            <Avatar size={22} />
            <TextBar w="28%" />
          </div>
          <TextBar w="70%" />
          <div className="flex items-center gap-1.5">
            <Music className="h-3 w-3 text-white/30" />
            <TextBar w="35%" />
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-col items-center gap-3 pb-1">
          <Heart className="h-5 w-5 text-white/40" />
          <MessageCircle className="h-5 w-5 text-white/40" />
          <Send className="h-5 w-5 text-white/40" />
          <MoreHorizontal className="h-5 w-5 text-white/40" />
        </div>
      </div>

      {/* Bottom nav bar */}
      <div className="flex items-center justify-around px-4 py-2 bg-black/20">
        <Home className="h-4 w-4 text-white/30" />
        <Search className="h-4 w-4 text-white/30" />
        <Plus className="h-4 w-4 text-white/30" />
        <PlaySquare className="h-4 w-4 text-white/30" />
        <User className="h-4 w-4 text-white/30" />
      </div>
    </div>
  </div>
);

export default PlatformOverlay;
