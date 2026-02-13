import { useState, useCallback } from "react";
import { Download, Loader2, Sparkles, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CropEditor from "@/components/CropEditor";
import { useI18n } from "@/lib/i18n";
import type { LogoConfig } from "@/components/LogoEditor";
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
  logo?: LogoConfig | null;
}

export async function exportFormat(
  mediaSrc: string,
  mediaType: MediaType,
  format: FormatConfig,
  offsetX: number,
  offsetY: number,
  zoom: number,
  logo?: LogoConfig | null
): Promise<Blob> {
  if (mediaType === "image") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = mediaSrc;
    });
    const blob = await renderImageToCanvas(img, format, offsetX, offsetY, zoom);
    if (logo) return compositeLogoOnBlob(blob, format, logo);
    return blob;
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

async function compositeLogoOnBlob(
  baseBlob: Blob,
  format: FormatConfig,
  logo: LogoConfig
): Promise<Blob> {
  const baseImg = new Image();
  baseImg.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    baseImg.onload = () => resolve();
    baseImg.onerror = () => reject();
    baseImg.src = URL.createObjectURL(baseBlob);
  });

  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    logoImg.onload = () => resolve();
    logoImg.onerror = () => reject();
    logoImg.src = logo.src;
  });

  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(baseImg, 0, 0);

  const logoW = format.width * logo.scale;
  const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;
  const margin = format.width * 0.04;

  let lx: number, ly: number;
  if (logo.position.includes("left")) lx = margin;
  else lx = format.width - logoW - margin;
  if (logo.position.includes("top")) ly = margin;
  else ly = format.height - logoH - margin;

  ctx.globalAlpha = logo.opacity;
  ctx.drawImage(logoImg, lx, ly, logoW, logoH);
  ctx.globalAlpha = 1;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Logo composite failed"))),
      "image/jpeg",
      0.85
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const FormatOutput = ({ mediaSrc, mediaType, format, originalName, showSafeZones, fixedHeight, logo }: FormatOutputProps) => {
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [preExpandZoom, setPreExpandZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const { t } = useI18n();

  const baseName = originalName.replace(/\.[^.]+$/, "");
  const ext = mediaType === "video" ? "mp4" : "jpg";

  const activeSrc = (expandedSrc && mediaType === "image") ? expandedSrc : mediaSrc;

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await exportFormat(activeSrc, mediaType, format, offsetX, offsetY, expandedSrc ? 1 : zoom, logo);
      downloadBlob(blob, `${baseName}_${format.ratio.replace(":", "x")}.${ext}`);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  const handleAiExpand = useCallback(async () => {
    setExpanding(true);
    // Save zoom before expand so we can restore on reset
    if (!expandedSrc) setPreExpandZoom(zoom);
    try {
      let blob: Blob;
      const expandZoom = expandedSrc ? preExpandZoom : zoom;
      if (mediaType === "video") {
        const videoEl = document.querySelector(`video[src="${mediaSrc}"]`) as HTMLVideoElement | null;
        if (!videoEl) throw new Error("Video element not found");
        const canvas = document.createElement("canvas");
        canvas.width = format.width;
        canvas.height = format.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, format.width, format.height);
        const srcW = videoEl.videoWidth;
        const srcH = videoEl.videoHeight;
        const srcRatio = srcW / srcH;
        const dstRatio = format.width / format.height;
        let baseW: number, baseH: number;
        if (srcRatio > dstRatio) { baseH = format.height; baseW = format.height * srcRatio; }
        else { baseW = format.width; baseH = format.width / srcRatio; }
        const drawW = baseW * expandZoom;
        const drawH = baseH * expandZoom;
        const overflowX = drawW - format.width;
        const overflowY = drawH - format.height;
        const x = overflowX > 0 ? -offsetX * overflowX : (format.width - drawW) / 2;
        const y = overflowY > 0 ? -offsetY * overflowY : (format.height - drawH) / 2;
        ctx.drawImage(videoEl, x, y, drawW, drawH);
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Canvas blob failed")), "image/jpeg", 0.85);
        });
      } else {
        // For retry: render from original source at pre-expand zoom
        blob = await exportFormat(mediaSrc, mediaType, format, offsetX, offsetY, expandZoom);
      }

      const base64 = await blobToBase64(blob);

      const { data, error } = await supabase.functions.invoke("ai-outpaint", {
        body: { imageBase64: base64, customPrompt: customPrompt || undefined },
      });

      if (error) throw error;
      if (data?.imageUrl) {
        setExpandedSrc(data.imageUrl);
        if (mediaType === "image") {
          setZoom(1);
          setOffsetX(0.5);
          setOffsetY(0.5);
        }
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("AI expand failed:", e);
      toast.error(t.aiExpandError);
    } finally {
      setExpanding(false);
    }
  }, [mediaSrc, mediaType, format, offsetX, offsetY, zoom, preExpandZoom, expandedSrc, customPrompt, t]);

  const handleReset = useCallback(() => {
    setExpandedSrc(null);
    setZoom(preExpandZoom);
    setCustomPrompt("");
  }, [preExpandZoom]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
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

      {/* Retry bar after AI expand */}
      {expandedSrc && (
        <div className="flex items-center gap-2">
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={t.aiPromptPlaceholder}
            className="flex-1 h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !expanding) handleAiExpand();
            }}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAiExpand}
            disabled={expanding}
            className="gap-1 h-8 px-2.5"
          >
            {expanding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            {t.aiRetry}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="gap-1 h-8 px-2.5"
          >
            <X className="h-3.5 w-3.5" />
            {t.aiReset}
          </Button>
        </div>
      )}

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
        logo={logo}
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
