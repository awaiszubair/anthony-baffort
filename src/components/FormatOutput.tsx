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

  // For images: use expanded as the full source. For video: keep original video, expanded is background.
  const activeSrc = (expandedSrc && mediaType === "image") ? expandedSrc : mediaSrc;

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
    setExpanding(true);
    try {
      // For video: grab current frame from the video element in the DOM
      let blob: Blob;
      if (mediaType === "video") {
        const videoEl = document.querySelector(`video[src="${mediaSrc}"]`) as HTMLVideoElement | null;
        if (!videoEl) throw new Error("Video element not found");
        // Render current frame to canvas at format dimensions
        const canvas = document.createElement("canvas");
        canvas.width = format.width;
        canvas.height = format.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, format.width, format.height);
        // Compute draw params same as renderImageToCanvas
        const srcW = videoEl.videoWidth;
        const srcH = videoEl.videoHeight;
        const srcRatio = srcW / srcH;
        const dstRatio = format.width / format.height;
        let baseW: number, baseH: number;
        if (srcRatio > dstRatio) { baseH = format.height; baseW = format.height * srcRatio; }
        else { baseW = format.width; baseH = format.width / srcRatio; }
        const drawW = baseW * zoom;
        const drawH = baseH * zoom;
        const overflowX = drawW - format.width;
        const overflowY = drawH - format.height;
        const x = overflowX > 0 ? -offsetX * overflowX : (format.width - drawW) / 2;
        const y = overflowY > 0 ? -offsetY * overflowY : (format.height - drawH) / 2;
        ctx.drawImage(videoEl, x, y, drawW, drawH);
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas blob failed")), "image/jpeg", 0.85);
        });
      } else {
        blob = await exportFormat(mediaSrc, mediaType, format, offsetX, offsetY, zoom);
      }

      const base64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke("ai-outpaint", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setExpandedSrc(data.imageUrl);
        if (mediaType === "image") {
          setZoom(1);
          setOffsetX(0.5);
          setOffsetY(0.5);
        }
        // For video: expandedSrc is used as background behind the video
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

  const showExpandButton = zoom < 1 && !expandedSrc;

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
        zoom={expandedSrc && mediaType === "image" ? 1 : zoom}
        showSafeZones={showSafeZones}
        fixedHeight={fixedHeight}
        expandedBackground={mediaType === "video" ? expandedSrc ?? undefined : undefined}
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
