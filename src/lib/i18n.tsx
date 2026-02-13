import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "nl" | "fr" | "en";

const translations = {
  nl: {
    title: "Image & Video Resizer",
    subtitle: "Upload één bestand, pas de positie aan per formaat",
    dropTitle: "Sleep je foto of video hierheen",
    dropTitleDragging: "Drop je bestand hier",
    dropSubtitle: "of klik om te uploaden • PNG, JPG, WEBP, MP4, MOV",
    reset: "Opnieuw",
    safeZonesOn: "Safe zones aan",
    safeZonesOff: "Safe zones uit",
    original: "Origineel",
    download: "Download",
    downloadAll: "Download alles",
    exporting: "Exporteren…",
    safeZoneLabel: "Safe zone",
    newPhotoTitle: "Volgende foto?",
    newPhotoDescription: "Wil je nog een foto toevoegen?",
    yes: "Ja",
    no: "Nee",
  },
  fr: {
    title: "Image & Video Resizer",
    subtitle: "Téléchargez un fichier, ajustez la position par format",
    dropTitle: "Glissez votre photo ou vidéo ici",
    dropTitleDragging: "Déposez votre fichier ici",
    dropSubtitle: "ou cliquez pour télécharger • PNG, JPG, WEBP, MP4, MOV",
    reset: "Recommencer",
    safeZonesOn: "Safe zones on",
    safeZonesOff: "Safe zones off",
    original: "Original",
    download: "Télécharger",
    downloadAll: "Tout télécharger",
    exporting: "Exportation…",
    safeZoneLabel: "Safe zone",
    newPhotoTitle: "Photo suivante?",
    newPhotoDescription: "Voulez-vous ajouter une autre photo?",
    yes: "Oui",
    no: "Non",
  },
  en: {
    title: "Image & Video Resizer",
    subtitle: "Upload one file, adjust position per format",
    dropTitle: "Drag your photo or video here",
    dropTitleDragging: "Drop your file here",
    dropSubtitle: "or click to upload • PNG, JPG, WEBP, MP4, MOV",
    reset: "Reset",
    safeZonesOn: "Safe zones on",
    safeZonesOff: "Safe zones off",
    original: "Original",
    download: "Download",
    downloadAll: "Download all",
    exporting: "Exporting…",
    safeZoneLabel: "Safe zone",
    newPhotoTitle: "Next photo?",
    newPhotoDescription: "Would you like to add another photo?",
    yes: "Yes",
    no: "No",
  },
} as const;

export type Translations = (typeof translations)[Locale];

function detectLocale(): Locale {
  const lang = navigator.language?.toLowerCase() ?? "";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("nl")) return "nl";
  return "en";
}

interface I18nContextType {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  t: translations.en,
  setLocale: () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  return (
    <I18nContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};
