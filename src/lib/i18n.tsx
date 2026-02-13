import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "nl" | "fr" | "en";

const translations = {
  nl: {
    title: "Image & Video Resizer",
    subtitle: "Ad Creative Resizer",
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
    safeZoneTooltip: "De safe zone is het gebied in je advertentie waar belangrijke elementen — zoals tekstoverlays en logo's — niet worden afgesneden of bedekt door de gebruikersinterface van het platform.",
    newPhotoTitle: "Volgende foto?",
    newPhotoDescription: "Wil je nog een foto toevoegen?",
    yes: "Ja",
    no: "Nee",
    uploadIntro: "Upload je afbeelding of video en wij schalen het automatisch naar de drie belangrijkste advertising formaten voor Meta, Instagram en TikTok. Gebruik de safe zones om te controleren of belangrijke elementen (tekst, logo's, gezichten) niet worden afgesneden door UI-overlays van het platform.",
  },
  fr: {
    title: "Image & Video Resizer",
    subtitle: "Ad Creative Resizer",
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
    safeZoneTooltip: "La safe zone est la zone de votre publicité où les éléments importants — comme les textes et logos superposés — ne seront pas coupés ou masqués par l'interface utilisateur de la plateforme.",
    newPhotoTitle: "Photo suivante?",
    newPhotoDescription: "Voulez-vous ajouter une autre photo?",
    yes: "Oui",
    no: "Non",
    uploadIntro: "Téléchargez votre image ou vidéo et nous la redimensionnons automatiquement aux trois formats publicitaires clés pour Meta, Instagram et TikTok. Utilisez les safe zones pour vérifier que les éléments importants (texte, logos, visages) ne sont pas coupés par les superpositions de la plateforme.",
  },
  en: {
    title: "Image & Video Resizer",
    subtitle: "Ad Creative Resizer",
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
    safeZoneTooltip: "The safe zone is the area within your ad where important elements — like text overlays and logos — will not be cropped out or covered by the platform's user interface.",
    newPhotoTitle: "Next photo?",
    newPhotoDescription: "Would you like to add another photo?",
    yes: "Yes",
    no: "No",
    uploadIntro: "Upload your image or video and we'll automatically resize it to the three key advertising formats for Meta, Instagram and TikTok. Use the safe zones to check that important elements (text, logos, faces) aren't cut off by platform UI overlays.",
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
