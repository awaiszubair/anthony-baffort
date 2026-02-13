import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const ACCEPT = "image/*,video/*";

const DropZone = ({ onFileSelect }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useI18n();

  const isValidFile = (file: File) =>
    file.type.startsWith("image/") || file.type.startsWith("video/");

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && isValidFile(file)) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
    };
    input.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDrag}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDrop={handleDrop}
      className={`
        relative cursor-pointer rounded border-2 border-dashed p-14
        transition-all duration-300 ease-out
        flex flex-col items-center justify-center gap-5 text-center
        ${
          isDragging
            ? "border-foreground bg-accent scale-[1.01]"
            : "border-border hover:border-foreground/30 hover:bg-accent/50"
        }
      `}
    >
      <div
        className={`rounded-full p-4 transition-colors ${
          isDragging ? "bg-foreground/10" : "bg-secondary"
        }`}
      >
        {isDragging ? (
          <ImageIcon className="h-7 w-7 text-foreground" />
        ) : (
          <Upload className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-base font-medium text-foreground tracking-wide">
          {isDragging ? t.dropTitleDragging : t.dropTitle}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground tracking-wider uppercase">
          {t.dropSubtitle}
        </p>
      </div>
    </div>
  );
};

export default DropZone;
