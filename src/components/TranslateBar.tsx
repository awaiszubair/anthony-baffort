import { useState, useCallback } from "react";
import { Languages, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { TextConfig } from "@/components/TextEditor";

const TRANSLATE_LANGS = [
  { code: "nl", label: "NL", name: "Nederlands" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "en", label: "EN", name: "English" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "it", label: "IT", name: "Italiano" },
];

interface TranslateBarProps {
  textConfig: TextConfig;
  onTextChange: (config: TextConfig) => void;
}

const TranslateBar = ({ textConfig, onTextChange }: TranslateBarProps) => {
  const [translating, setTranslating] = useState<string | null>(null);
  const { t } = useI18n();

  const handleTranslate = useCallback(async (langCode: string) => {
    if (!textConfig.text.trim()) return;
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

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground font-medium shrink-0">{t.translateTo}</span>
      <div className="flex gap-1.5">
        {TRANSLATE_LANGS.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleTranslate(lang.code)}
            disabled={!!translating}
            title={lang.name}
            className={`px-2.5 h-7 rounded border text-[11px] font-semibold tracking-wide transition-colors cursor-pointer
              ${translating === lang.code
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/40 hover:bg-muted text-muted-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {translating === lang.code ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              lang.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TranslateBar;
