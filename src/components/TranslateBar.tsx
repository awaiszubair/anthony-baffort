import { useState, useCallback } from "react";
import { Languages, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import type { TextConfig } from "@/components/TextEditor";

const LANGS = [
  { code: "original", label: "Origineel" },
  { code: "nl", label: "NL" },
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
];

interface TranslateBarProps {
  textConfig: TextConfig;
  onTextChange: (config: TextConfig) => void;
}

const TranslateBar = ({ textConfig, onTextChange }: TranslateBarProps) => {
  const [translating, setTranslating] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState("original");
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [doneLangs, setDoneLangs] = useState<Set<string>>(new Set());
  const { t } = useI18n();

  const handleLangClick = useCallback(async (langCode: string) => {
    if (langCode === activeLang || translating) return;

    // Save original text on first translation
    if (!originalText) {
      setOriginalText(textConfig.text);
    }

    if (langCode === "original") {
      onTextChange({ ...textConfig, text: originalText || textConfig.text });
      setActiveLang("original");
      return;
    }

    setTranslating(langCode);
    try {
      const sourceText = originalText || textConfig.text;
      const { data, error } = await supabase.functions.invoke("translate-text", {
        body: { text: sourceText, targetLanguage: langCode },
      });
      if (error) throw error;
      if (data?.translatedText) {
        onTextChange({ ...textConfig, text: data.translatedText });
        setActiveLang(langCode);
        setDoneLangs((prev) => new Set(prev).add(langCode));
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("Translation failed:", e);
      toast.error(t.translateError);
    } finally {
      setTranslating(null);
    }
  }, [textConfig, onTextChange, activeLang, originalText, translating, t]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Languages className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex gap-1">
        {LANGS.map((lang) => {
          const isActive = activeLang === lang.code;
          const isDone = doneLangs.has(lang.code);
          const isLoading = translating === lang.code;

          return (
            <button
              key={lang.code}
              onClick={() => handleLangClick(lang.code)}
              disabled={!!translating && !isLoading}
              className={`relative px-2.5 h-7 rounded text-[11px] font-semibold tracking-wide transition-all cursor-pointer
                ${isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isDone
                    ? "bg-muted text-foreground border border-border"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  {lang.label}
                  {isDone && !isActive && <Check className="h-2.5 w-2.5" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TranslateBar;
