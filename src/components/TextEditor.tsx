import { useCallback } from "react";
import { Type, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

export type TextPosition = "top-left" | "top-center" | "top-right" | "center" | "bottom-left" | "bottom-center" | "bottom-right";

export interface TextConfig {
  text: string;
  font: string;
  position: TextPosition;
  size: number;
  color: string;
  opacity: number;
}

const FONTS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial Black, sans-serif", label: "Arial Black" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "'Trebuchet MS', sans-serif", label: "Trebuchet MS" },
  { value: "Verdana, sans-serif", label: "Verdana" },
];

const POSITIONS: { value: TextPosition; label: string }[] = [
  { value: "top-left", label: "↖" },
  { value: "top-center", label: "↑" },
  { value: "top-right", label: "↗" },
  { value: "center", label: "●" },
  { value: "bottom-left", label: "↙" },
  { value: "bottom-center", label: "↓" },
  { value: "bottom-right", label: "↘" },
];

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF0000",
  "#FFFF00",
  "#00FF00",
  "#00BFFF",
  "#FF69B4",
  "#FFA500",
];

interface TextEditorProps {
  textConfig: TextConfig | null;
  onTextChange: (config: TextConfig | null) => void;
}

const TextEditor = ({ textConfig, onTextChange }: TextEditorProps) => {
  const { t } = useI18n();

  const handleAdd = useCallback(() => {
    onTextChange({
      text: "",
      font: "Inter, sans-serif",
      position: "bottom-center",
      size: 0.05,
      color: "#FFFFFF",
      opacity: 1,
    });
  }, [onTextChange]);

  const handleRemove = useCallback(() => {
    onTextChange(null);
  }, [onTextChange]);

  if (!textConfig) {
    return (
      <Button variant="outline" size="sm" onClick={handleAdd} className="gap-1.5">
        <Type className="h-3.5 w-3.5" />
        {t.addText}
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Type className="h-3.5 w-3.5" />
          {t.editText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-4" align="start">
        {/* Text input */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.textContent}</p>
          <Input
            value={textConfig.text}
            onChange={(e) => onTextChange({ ...textConfig, text: e.target.value })}
            placeholder={t.textPlaceholder}
            className="text-sm"
          />
        </div>

        {/* Font */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.textFont}</p>
          <Select
            value={textConfig.font}
            onValueChange={(v) => onTextChange({ ...textConfig, font: v })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.textPosition}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                onClick={() => onTextChange({ ...textConfig, position: pos.value })}
                className={`h-8 rounded border text-sm font-medium transition-colors cursor-pointer ${
                  textConfig.position === pos.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.textSize} — {Math.round(textConfig.size * 100)}%
          </p>
          <Slider
            min={0.03}
            max={0.5}
            step={0.01}
            value={[textConfig.size]}
            onValueChange={([v]) => onTextChange({ ...textConfig, size: v })}
          />
        </div>

        {/* Color */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.textColor}</p>
          <div className="flex gap-1.5 flex-wrap items-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onTextChange({ ...textConfig, color: c })}
                className={`h-6 w-6 rounded-full border-2 transition-transform cursor-pointer ${
                  textConfig.color === c ? "border-primary scale-110" : "border-border"
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
            <label className="relative h-6 w-6 rounded-full border-2 border-border overflow-hidden cursor-pointer" title="Custom color">
              <input
                type="color"
                value={textConfig.color}
                onChange={(e) => onTextChange({ ...textConfig, color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <span className="block h-full w-full bg-gradient-conic from-red-500 via-green-500 to-blue-500 rounded-full" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
            </label>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={textConfig.color}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onTextChange({ ...textConfig, color: v });
              }}
              placeholder="#FF0000"
              className="text-xs font-mono h-7 w-24"
              maxLength={7}
            />
            <span
              className="h-5 w-5 rounded border border-border shrink-0"
              style={{ backgroundColor: textConfig.color }}
            />
          </div>
        </div>

        {/* Opacity */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t.textOpacity} — {Math.round(textConfig.opacity * 100)}%
          </p>
          <Slider
            min={0.1}
            max={1}
            step={0.05}
            value={[textConfig.opacity]}
            onValueChange={([v]) => onTextChange({ ...textConfig, opacity: v })}
          />
        </div>

        {/* Remove */}
        <Button variant="destructive" size="sm" onClick={handleRemove} className="w-full gap-1.5">
          <Trash2 className="h-3.5 w-3.5" />
          {t.removeText}
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default TextEditor;
