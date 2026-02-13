import { useState, useMemo, useCallback } from "react";
import { RotateCcw, Shield, ShieldOff, Download, Loader2, Moon, Sun } from "lucide-react";
import logoLandscapeBlack from "@/assets/logo-landscape-black.svg";
import logoLandscapeWhite from "@/assets/logo-landscape-white.svg";
import { useDarkMode } from "@/hooks/use-dark-mode";
import DropZone from "@/components/DropZone";
import FormatOutput from "@/components/FormatOutput";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { FORMATS, detectMediaType, downloadBlob, renderImageToCanvas, renderVideoToBlob, type MediaType } from "@/lib/mediaUtils";

const Index = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showNewPhotoDialog, setShowNewPhotoDialog] = useState(false);
  const { t } = useI18n();

  const mediaSrc = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const isValidFile = (f: File) =>
    f.type.startsWith("image/") || f.type.startsWith("video/");

  const handleFile = (f: File) => {
    setMediaType(detectMediaType(f));
    setFile(f);
  };

  const handleGlobalDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleGlobalDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const f = e.dataTransfer.files?.[0];
      if (f && isValidFile(f)) handleFile(f);
    },
    []
  );

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
      setShowNewPhotoDialog(true);
    }
  };

  return (
    <div className="min-h-screen bg-background" onDragOver={handleGlobalDrag} onDrop={handleGlobalDrop}>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <div>
            <img src={isDark ? logoLandscapeWhite : logoLandscapeBlack} alt="Landing Partners" className="h-7" />
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-light">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleDark} className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer" aria-label="Toggle dark mode">
              {isDark ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
            </button>
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
            <p className="mb-6 text-sm text-muted-foreground">{t.uploadIntro}</p>
            <DropZone onFileSelect={handleFile} />
            <div className="mt-8 flex items-center justify-center gap-6 text-muted-foreground/60">
              {FORMATS.map((f, i) => (
                <div key={f.id} className="flex items-center gap-6">
                  {i > 0 && <span className="text-border">·</span>}
                  <span className="text-xs tracking-wider uppercase">{f.label} — {f.ratio}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Original preview */}
            <div className="flex justify-center">
            <div className="inline-block">
              <p className="mb-3 text-sm font-medium text-muted-foreground">{t.original} — {file.name}</p>
              <div className="overflow-hidden rounded-xl border border-border bg-card inline-block">
                {mediaType === "image" ? (
                  <img src={mediaSrc} alt={t.original} className="max-h-80 block" />
                ) : (
                  <video src={mediaSrc} muted loop autoPlay playsInline className="max-h-80 block" />
                )}
              </div>
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

      <AlertDialog open={showNewPhotoDialog} onOpenChange={setShowNewPhotoDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>{t.newPhotoTitle}</AlertDialogTitle>
          <AlertDialogDescription>{t.newPhotoDescription}</AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>{t.no}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              handleReset();
              setShowNewPhotoDialog(false);
            }}>
              {t.yes}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
