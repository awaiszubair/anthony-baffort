import { useState, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import DropZone from "@/components/DropZone";
import FormatOutput from "@/components/FormatOutput";
import { Button } from "@/components/ui/button";
import { FORMATS, detectMediaType, type MediaType } from "@/lib/mediaUtils";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");

  const mediaSrc = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const handleFile = (f: File) => {
    setMediaType(detectMediaType(f));
    setFile(f);
  };

  const handleReset = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Image &amp; Video Resizer
            </h1>
            <p className="text-xs text-muted-foreground">
              Upload één bestand, pas de positie aan per formaat
            </p>
          </div>
          {file && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Opnieuw
            </Button>
          )}
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
              <p className="mb-3 text-sm font-medium text-muted-foreground">Origineel — {file.name}</p>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {mediaType === "image" ? (
                  <img src={mediaSrc} alt="Origineel" className="max-h-80 w-full object-contain" />
                ) : (
                  <video src={mediaSrc} muted loop autoPlay playsInline className="max-h-80 w-full object-contain" />
                )}
              </div>
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
