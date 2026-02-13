import { useState, useMemo } from "react";
import { RotateCcw, Shield, ShieldOff, Download, Loader2 } from "lucide-react";
import DropZone from "@/components/DropZone";
import FormatOutput from "@/components/FormatOutput";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { FORMATS, detectMediaType, downloadBlob, renderImageToCanvas, renderVideoToBlob, type MediaType } from "@/lib/mediaUtils";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { t } = useI18n();

  const mediaSrc = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const handleFile = (f: File) => {
    setMediaType(detectMediaType(f));
    setFile(f);
  };

  const handleReset = () => {
    setFile(null);
  };

  const handleDownloadAll = async () => {
    if (!file) return;
    setDownloadingAll(true);
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = mediaType === "video" ? "mp4" : "jpg";

    try {
      for (const format of FORMATS) {
        let blob: Blob;
        if (mediaType === "image") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = mediaSrc;
          });
          blob = await renderImageToCanvas(img, format, 0.5, 0.5, 1);
        } else {
          const video = document.createElement("video");
          video.src = mediaSrc;
          video.muted = true;
          await new Promise<void>((resolve, reject) => {
            video.oncanplay = () => resolve();
            video.onerror = () => reject();
            video.load();
          });
          blob = await renderVideoToBlob(video, format, 0.5, 0.5, 1);
        }
        downloadBlob(blob, `${baseName}_${format.ratio.replace(":", "x")}.${ext}`);
      }
    } catch (e) {
      console.error("Download all failed:", e);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {t.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            {file && (
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                {t.reset}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {!file ? (
          <div className="mx-auto max-w-xl">
            <DropZone onFileSelect={handleFile} />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {FORMATS.map((f) => (
                <div
                  key={f.id}
                  className="rounded-lg border border-border bg-card p-3 text-center"
                >
                  <p className="text-sm font-medium text-card-foreground">{f.ratio}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.width}×{f.height}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Original preview */}
            <div className="mx-auto max-w-2xl">
              <p className="mb-3 text-sm font-medium text-muted-foreground">{t.original} — {file.name}</p>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {mediaType === "image" ? (
                  <img src={mediaSrc} alt={t.original} className="max-h-80 w-full object-contain" />
                ) : (
                  <video src={mediaSrc} muted loop autoPlay playsInline className="max-h-80 w-full object-contain" />
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSafeZones((v) => !v)}
                className="gap-1.5"
              >
                {showSafeZones ? (
                  <ShieldOff className="h-3.5 w-3.5" />
                ) : (
                  <Shield className="h-3.5 w-3.5" />
                )}
                {showSafeZones ? t.safeZonesOff : t.safeZonesOn}
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="gap-1.5"
              >
                {downloadingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {downloadingAll ? t.exporting : t.downloadAll}
              </Button>
            </div>

            {/* Resized formats */}
            <div className="grid gap-8 lg:grid-cols-3">
              {FORMATS.map((format) => (
                <FormatOutput
                  key={format.id}
                  mediaSrc={mediaSrc}
                  mediaType={mediaType}
                  format={format}
                  originalName={file.name}
                  showSafeZones={showSafeZones}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
