import { useState, useMemo, useCallback, useEffect } from "react";
import { RotateCcw, Shield, ShieldOff, Download, Loader2, Moon, Sun, Info, Languages } from "lucide-react";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import DropZone from "@/components/DropZone";
import FormatOutput from "@/components/FormatOutput";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LogoEditor, { type LogoConfig } from "@/components/LogoEditor";
import TextEditor, { type TextConfig } from "@/components/TextEditor";
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
import { FORMATS, detectMediaType, downloadBlob, renderImageToCanvas, renderVideoToBlob, type MediaType } from "@/lib/mediaUtils";

const Index = () => {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { brand, hasBrand } = useBrandSettings();
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showNewPhotoDialog, setShowNewPhotoDialog] = useState(false);
  const [showTranslateBar, setShowTranslateBar] = useState(false);
  const [logo, setLogo] = useState<LogoConfig | null>(null);
  const [textOverlay, setTextOverlay] = useState<TextConfig | null>(null);
  const [brandDefaultsApplied, setBrandDefaultsApplied] = useState(false);
  const { t } = useI18n();

  // Apply brand defaults from settings on first file upload
  useEffect(() => {
    if (file && hasBrand && !brandDefaultsApplied) {
      if (brand.logoUrl && !logo) {
        setLogo({
          src: brand.logoUrl,
          position: "bottom-right",
          scale: 0.15,
          opacity: 1,
        });
      }
      if (brand.fontFamily && !textOverlay) {
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
  }, [file, hasBrand, brandDefaultsApplied]);

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
    setBrandDefaultsApplied(false);
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
      <div className="container mx-auto flex items-center justify-end px-4 py-3">
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

      <main className="container mx-auto px-4 py-10">
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
