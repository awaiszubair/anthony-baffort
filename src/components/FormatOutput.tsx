import { useState, useCallback } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CropEditor from "@/components/CropEditor";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  type FormatConfig,
  type MediaType,
  downloadBlob,
  renderImageToCanvas,
  renderVideoToBlob,
} from "@/lib/mediaUtils";

interface FormatOutputProps {
  mediaSrc: string;
  mediaType: MediaType;
  format: FormatConfig;
  originalName: string;
  showSafeZones: boolean;
  fixedHeight?: boolean;
}

export async function exportFormat(
  mediaSrc: string,
  mediaType: MediaType,
  format: FormatConfig,
  offsetX: number,
  offsetY: number,
  zoom: number
): Promise<Blob> {
  if (mediaType === "image") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = mediaSrc;
    });
    return renderImageToCanvas(img, format, offsetX, offsetY, zoom);
  } else {
    const video = document.createElement("video");
    video.src = mediaSrc;
    video.muted = true;
    await new Promise<void>((resolve, reject) => {
      video.oncanplay = () => resolve();
      video.onerror = () => reject();
      video.load();
    });
    return renderVideoToBlob(video, format, offsetX, offsetY, zoom);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const FormatOutput = ({ mediaSrc, mediaType, format, originalName, showSafeZones, fixedHeight }: FormatOutputProps) => {
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);
  const { t } = useI18n();

  const baseName = originalName.replace(/\.[^.]+$/, "");
  const ext = mediaType === "video" ? "mp4" : "jpg";

  // Use expanded image if available, otherwise original
  const activeSrc = expandedSrc || mediaSrc;

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await exportFormat(activeSrc, mediaType, format, offsetX, offsetY, expandedSrc ? 1 : zoom);
      downloadBlob(blob, `${baseName}_${format.ratio.replace(":", "x")}.${ext}`);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleAiExpand = useCallback(async () => {
    if (mediaType !== "image") return;
    setExpanding(true);
    try {
      // Render current view (with black borders from zoom-out) to a canvas
      const blob = await exportFormat(mediaSrc, mediaType, format, offsetX, offsetY, zoom);
      const base64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke("ai-outpaint", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setExpandedSrc(data.imageUrl);
        // Reset zoom to 1 since the expanded image now fills the frame
        setZoom(1);
        setOffsetX(0.5);
        setOffsetY(0.5);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("AI expand failed:", e);
      toast.error(t.aiExpandError);
    } finally {
      setExpanding(false);
    }
  }, [mediaSrc, mediaType, format, offsetX, offsetY, zoom, t]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    // Clear expanded image when zoom changes
    if (expandedSrc) setExpandedSrc(null);
  }, [expandedSrc]);

  const showExpandButton = mediaType === "image" && zoom < 1 && !expandedSrc;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-card-foreground tracking-wide">{format.label}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {format.ratio} — {format.width}×{format.height}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showExpandButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAiExpand}
              disabled={expanding}
              className="gap-1.5"
            >
              {expanding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {expanding ? t.aiExpanding : t.aiExpand}
            </Button>
          )}
          <Button size="sm" onClick={handleDownload} disabled={exporting} className="gap-1.5">
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {exporting ? t.exporting : t.download}
          </Button>
        </div>
      </div>
      <CropEditor
        mediaSrc={activeSrc}
        mediaType={mediaType}
        format={format}
        offsetX={offsetX}
        offsetY={offsetY}
        zoom={expandedSrc ? 1 : zoom}
        showSafeZones={showSafeZones}
        fixedHeight={fixedHeight}
        onOffsetChange={(x, y) => {
          setOffsetX(x);
          setOffsetY(y);
        }}
        onZoomChange={handleZoomChange}
      />
    </div>
  );
};

export default FormatOutput;
