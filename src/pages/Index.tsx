import { useState, useCallback, useEffect } from "react";
import { RotateCcw, Shield, ShieldOff, Download, Loader2, Info, Languages } from "lucide-react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useResizerState } from "@/hooks/useResizerState";
import DropZone from "@/components/DropZone";
import FormatOutput from "@/components/FormatOutput";
import LogoEditor from "@/components/LogoEditor";
import TextEditor from "@/components/TextEditor";
import TranslateBar from "@/components/TranslateBar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";
import { FORMATS, downloadBlob, renderImageToCanvas, renderVideoToBlob } from "@/lib/mediaUtils";

const Index = () => {
  const { brand } = useBrandSettings();
  const {
    file, mediaType, mediaSrc, showSafeZones, showTranslateBar,
    logo, textOverlay, brandDefaultsApplied,
    handleFile, setShowSafeZones, setShowTranslateBar,
    setLogo, setTextOverlay, setBrandDefaultsApplied, reset,
  } = useResizerState();
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showNewPhotoDialog, setShowNewPhotoDialog] = useState(false);
  const { t } = useI18n();

  // Apply brand defaults from settings on first file upload
  useEffect(() => {
    if (file && !brandDefaultsApplied) {
      if (brand.logoUrl && !logo) {
        setLogo({
          src: brand.logoUrl,
          position: "bottom-right",
          scale: 0.15,
          opacity: 1,
        });
      }
      if (brand.fontFamily && brand.fontFamily !== "DM Sans" && !textOverlay) {
        setTextOverlay({
          text: "",
          font: `'${brand.fontFamily}', sans-serif`,
          position: "bottom-center",
          size: 0.05,
          color: "#FFFFFF",
          opacity: 1,
        });
      }
      setBrandDefaultsApplied(true);
    }
  }, [file, brandDefaultsApplied]);

  const isValidFile = (f: File) =>
    f.type.startsWith("image/") || f.type.startsWith("video/");

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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t.resizerTitle}</h1>
            <p className="text-muted-foreground">{t.resizerDescription}</p>
          </div>
          {file && (
            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                {t.reset}
              </Button>
            </div>
          )}
        </div>
        {!file ? (
          <div className="mx-auto max-w-xl">
            <div className="mb-6 text-sm text-muted-foreground space-y-2">
              <p>{t.uploadIntro}</p>
              <p>{t.uploadTip}</p>
            </div>
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
            <div className="flex flex-wrap lg:flex-nowrap gap-8 items-start justify-center">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer" aria-label="Safe zone info">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        {t.safeZoneTooltip}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <LogoEditor logo={logo} onLogoChange={setLogo} />
                  <TextEditor textConfig={textOverlay} onTextChange={setTextOverlay} />
                </div>

                <div className="flex items-center gap-2">
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
                  {textOverlay?.text?.trim() && (
                    <Button
                      variant={showTranslateBar ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowTranslateBar((v) => !v)}
                      className="gap-1.5"
                    >
                      <Languages className="h-3.5 w-3.5" />
                      {t.translateButton}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Translate bar */}
            {showTranslateBar && textOverlay?.text?.trim() && (
              <div className="flex justify-center">
                <TranslateBar
                  textConfig={textOverlay}
                  onTextChange={(updated) => setTextOverlay(updated)}
                />
              </div>
            )}

            {/* Resized formats */}
            <div className="flex flex-wrap lg:flex-nowrap gap-8 items-start justify-center">
              {FORMATS.map((format) => (
                <FormatOutput
                  key={format.id}
                  mediaSrc={mediaSrc}
                  mediaType={mediaType}
                  format={format}
                  originalName={file.name}
                  showSafeZones={showSafeZones}
                  fixedHeight
                  logo={logo}
                  textOverlay={textOverlay}
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
            {textOverlay?.text?.trim() && (
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewPhotoDialog(false);
                  setShowTranslateBar(true);
                }}
                className="gap-1.5"
              >
                <Languages className="h-3.5 w-3.5" />
                {t.otherLanguage}
              </Button>
            )}
            <AlertDialogCancel>{t.no}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              reset();
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
