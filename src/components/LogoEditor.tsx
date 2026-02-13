import { useState, useRef, useCallback } from "react";
import { ImagePlus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n";

export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "bottom-center";

export interface LogoConfig {
  src: string;
  position: LogoPosition;
  scale: number;
  opacity: number;
}

const POSITIONS = [
  { value: "top-left" as const, label: "↖" },
  { value: "top-right" as const, label: "↗" },
  { value: "bottom-left" as const, label: "↙" },
  { value: "bottom-center" as const, label: "↓" },
  { value: "bottom-right" as const, label: "↘" },
];

interface LogoEditorProps {
  logo: LogoConfig | null;
  onLogoChange: (logo: LogoConfig | null) => void;
}

const LogoEditor = ({ logo, onLogoChange }: LogoEditorProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onLogoChange({
        src: url,
        position: "bottom-right",
        scale: 0.15,
        opacity: 1,
      });
    },
    [onLogoChange]
  );

  const handleRemove = useCallback(() => {
    onLogoChange(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [onLogoChange]);

  if (!logo) {
    return (
      <>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          className="gap-1.5"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {t.addLogo}
        </Button>
      </>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <img src={logo.src} alt="Logo" className="h-4 w-4 object-contain" />
          {t.editLogo}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-4" align="start">
        {/* Position */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.logoPosition}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {POSITIONS.filter(p => p.value !== "bottom-center").map((pos) => (
              <button
                key={pos.value}
                onClick={() => onLogoChange({ ...logo, position: pos.value })}
                className={`h-8 rounded border text-sm font-medium transition-colors cursor-pointer ${
                  logo.position === pos.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => onLogoChange({ ...logo, position: "bottom-center" })}
            className={`w-full h-8 rounded border text-xs font-medium transition-colors cursor-pointer mt-1.5 ${
              logo.position === "bottom-center"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            ↓ Midden onder
          </button>
        </div>

        {/* Scale */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.logoSize} — {Math.round(logo.scale * 100)}%
          </p>
          <Slider
            min={0.05}
            max={0.4}
            step={0.01}
            value={[logo.scale]}
            onValueChange={([v]) => onLogoChange({ ...logo, scale: v })}
          />
        </div>

        {/* Opacity */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.logoOpacity} — {Math.round(logo.opacity * 100)}%
          </p>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={[logo.opacity]}
            onValueChange={([v]) => onLogoChange({ ...logo, opacity: v })}
          />
        </div>

        {/* Remove */}
        <Button variant="destructive" size="sm" onClick={handleRemove} className="w-full gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          {t.removeLogo}
        </Button>

        {/* Change logo */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="w-full gap-1.5">
          <ImagePlus className="h-3.5 w-3.5" />
          {t.changeLogo}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default LogoEditor;
