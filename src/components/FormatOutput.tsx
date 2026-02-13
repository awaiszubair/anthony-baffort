import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CropEditor from "@/components/CropEditor";
import { useI18n } from "@/lib/i18n";
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

const FormatOutput = ({ mediaSrc, mediaType, format, originalName, showSafeZones }: FormatOutputProps) => {
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { t } = useI18n();

  const baseName = originalName.replace(/\.[^.]+$/, "");
  const ext = mediaType === "video" ? "mp4" : "jpg";

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await exportFormat(mediaSrc, mediaType, format, offsetX, offsetY, zoom);
      downloadBlob(blob, `${baseName}_${format.ratio.replace(":", "x")}.${ext}`);
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-card-foreground tracking-wide">{format.label}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            {format.ratio} — {format.width}×{format.height}
          </p>
        </div>
        <Button size="sm" onClick={handleDownload} disabled={exporting} className="gap-1.5">
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {exporting ? t.exporting : t.download}
        </Button>
      </div>
      <CropEditor
        mediaSrc={mediaSrc}
        mediaType={mediaType}
        format={format}
        offsetX={offsetX}
        offsetY={offsetY}
        zoom={zoom}
        showSafeZones={showSafeZones}
        onOffsetChange={(x, y) => {
          setOffsetX(x);
          setOffsetY(y);
        }}
        onZoomChange={setZoom}
      />
    </div>
  );
};

export default FormatOutput;
