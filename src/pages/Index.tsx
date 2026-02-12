import { useState } from "react";
import { Loader2, RotateCcw, Download } from "lucide-react";
import DropZone from "@/components/DropZone";
import FormatCard from "@/components/FormatCard";
import { Button } from "@/components/ui/button";
import { FORMATS, resizeImage, downloadBlob, type ResizedImage } from "@/lib/imageResizer";

const Index = () => {
  const [results, setResults] = useState<ResizedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalName, setOriginalName] = useState("");

  const handleFile = async (file: File) => {
    setLoading(true);
    setOriginalName(file.name);
    try {
      const resized = await Promise.all(FORMATS.map((f) => resizeImage(file, f)));
      setResults(resized);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults([]);
    setOriginalName("");
  };

  const handleDownloadAll = () => {
    const baseName = originalName.replace(/\.[^.]+$/, "");
    results.forEach((r) =>
      downloadBlob(r.blob, `${baseName}_${r.format.ratio.replace(":", "x")}.png`)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Image Resizer
            </h1>
            <p className="text-xs text-muted-foreground">
              Upload één beeld, ontvang alle social media formaten
            </p>
          </div>
          {results.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Opnieuw
              </Button>
              <Button size="sm" onClick={handleDownloadAll} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Alles downloaden
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Beelden worden geresized…</p>
          </div>
        ) : results.length === 0 ? (
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
          <div className="grid gap-6 md:grid-cols-3">
            {results.map((r) => (
              <FormatCard key={r.format.id} result={r} originalName={originalName} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
