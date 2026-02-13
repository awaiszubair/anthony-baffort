import { useState, useCallback } from "react";
import { Type, Trash2, Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const TRANSLATE_LANGS = [
  { code: "nl", label: "NL" },
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
];

interface TextEditorProps {
  textConfig: TextConfig | null;
  onTextChange: (config: TextConfig | null) => void;
}

const TextEditor = ({ textConfig, onTextChange }: TextEditorProps) => {
  const { t } = useI18n();
  const [translating, setTranslating] = useState<string | null>(null);

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

  const handleTranslate = useCallback(async (langCode: string) => {
    if (!textConfig?.text.trim()) return;
    setTranslating(langCode);
    try {
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text: textConfig.text, targetLanguage: langCode },
      });
      if (error) throw error;
      if (data?.translatedText) {
        onTextChange({ ...textConfig, text: data.translatedText });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("Translation failed:", e);
      toast.error(t.translateError);
    } finally {
      setTranslating(null);
    }
  }, [textConfig, onTextChange, t]);

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

        {/* Translate */}
        {textConfig.text.trim() && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              <Languages className="h-3 w-3 inline mr-1" />
              {t.translateTo}
            </p>
            <div className="flex gap-1.5">
              {TRANSLATE_LANGS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleTranslate(lang.code)}
                  disabled={!!translating}
                  className={`flex-1 h-7 rounded border text-[11px] font-semibold tracking-wide transition-colors cursor-pointer
                    ${translating === lang.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted text-muted-foreground"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {translating === lang.code ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto" />
                  ) : (
                    lang.label
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
            min={0.02}
            max={0.15}
            step={0.005}
            value={[textConfig.size]}
            onValueChange={([v]) => onTextChange({ ...textConfig, size: v })}
          />
        </div>

        {/* Color */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">{t.textColor}</p>
          <div className="flex gap-1.5 flex-wrap">
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
