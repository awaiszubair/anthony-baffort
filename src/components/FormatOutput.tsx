import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CropEditor from "@/components/CropEditor";
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
}

const FormatOutput = ({ mediaSrc, mediaType, format, originalName }: FormatOutputProps) => {
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);

  const baseName = originalName.replace(/\.[^.]+$/, "");
  const ext = mediaType === "video" ? "mp4" : "jpg";

  const handleDownload = async () => {
    setExporting(true);
    try {
      let blob: Blob;
      if (mediaType === "image") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = mediaSrc;
        });
        blob = await renderImageToCanvas(img, format, offsetX, offsetY, zoom);
      } else {
        const video = document.createElement("video");
        video.src = mediaSrc;
        video.muted = true;
        await new Promise<void>((resolve, reject) => {
          video.oncanplay = () => resolve();
          video.onerror = () => reject();
          video.load();
        });
        blob = await renderVideoToBlob(video, format, offsetX, offsetY, zoom);
      }
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
          <p className="font-semibold text-card-foreground">{format.label}</p>
          <p className="text-xs text-muted-foreground">
            {format.ratio} — {format.width}×{format.height}
          </p>
        </div>
        <Button size="sm" onClick={handleDownload} disabled={exporting} className="gap-1.5">
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {exporting ? "Exporteren…" : "Download"}
        </Button>
      </div>
      <CropEditor
        mediaSrc={mediaSrc}
        mediaType={mediaType}
        format={format}
        offsetX={offsetX}
        offsetY={offsetY}
        zoom={zoom}
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
