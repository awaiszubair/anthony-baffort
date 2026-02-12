import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
}

const DropZone = ({ onFileSelect }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

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
      if (file && file.type.startsWith("image/")) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
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
        relative cursor-pointer rounded-xl border-2 border-dashed p-12
        transition-all duration-300 ease-out
        flex flex-col items-center justify-center gap-4 text-center
        ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02] animate-pulse-glow"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        }
      `}
    >
      <div
        className={`rounded-full p-4 transition-colors ${
          isDragging ? "bg-primary/20" : "bg-secondary"
        }`}
      >
        {isDragging ? (
          <ImageIcon className="h-8 w-8 text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="text-lg font-medium text-foreground">
          {isDragging ? "Drop je beeld hier" : "Sleep je beeld hierheen"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          of klik om te uploaden • PNG, JPG, WEBP
        </p>
      </div>
    </div>
  );
};

export default DropZone;
