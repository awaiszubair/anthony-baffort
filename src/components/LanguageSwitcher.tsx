import { useI18n, type Locale } from "@/lib/i18n";

const FLAGS: Record<Locale, string> = { nl: "🇳🇱", fr: "🇫🇷", en: "🇬🇧" };
const LOCALES: Locale[] = ["nl", "fr", "en"];

const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors ${
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {FLAGS[l]} {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
