import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResizedImage } from "@/lib/imageResizer";
import { downloadBlob } from "@/lib/imageResizer";

interface FormatCardProps {
  result: ResizedImage;
  originalName: string;
}

const FormatCard = ({ result, originalName }: FormatCardProps) => {
  const { format, dataUrl, blob } = result;
  const baseName = originalName.replace(/\.[^.]+$/, "");

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-semibold text-card-foreground">{format.label}</p>
          <p className="text-xs text-muted-foreground">
            {format.ratio} — {format.width}×{format.height}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            downloadBlob(blob, `${baseName}_${format.ratio.replace(":", "x")}.png`)
          }
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </div>
      <div className="flex items-center justify-center bg-muted/30 p-4">
        <img
          src={dataUrl}
          alt={`${format.label} preview`}
          className="max-h-64 rounded-md object-contain shadow-lg"
          style={{ aspectRatio: `${format.width}/${format.height}` }}
        />
      </div>
    </div>
  );
};

export default FormatCard;
