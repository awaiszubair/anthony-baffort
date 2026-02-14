import { createContext, useContext, useState, ReactNode, useMemo } from "react";
import type { LogoConfig } from "@/components/LogoEditor";
import type { TextConfig } from "@/components/TextEditor";
import type { MediaType } from "@/lib/mediaUtils";
import { detectMediaType } from "@/lib/mediaUtils";

interface ResizerState {
  file: File | null;
  mediaType: MediaType;
  mediaSrc: string;
  showSafeZones: boolean;
  showTranslateBar: boolean;
  logo: LogoConfig | null;
  textOverlay: TextConfig | null;
  brandDefaultsApplied: boolean;
  setFile: (f: File | null) => void;
  handleFile: (f: File) => void;
  setShowSafeZones: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowTranslateBar: (v: boolean | ((prev: boolean) => boolean)) => void;
  setLogo: (v: LogoConfig | null) => void;
  setTextOverlay: (v: TextConfig | null | ((prev: TextConfig | null) => TextConfig | null)) => void;
  setBrandDefaultsApplied: (v: boolean) => void;
  reset: () => void;
}

const ResizerContext = createContext<ResizerState | null>(null);

export function useResizerState() {
  const ctx = useContext(ResizerContext);
  if (!ctx) throw new Error("useResizerState must be used within ResizerProvider");
  return ctx;
}

export function ResizerProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showTranslateBar, setShowTranslateBar] = useState(false);
  const [logo, setLogo] = useState<LogoConfig | null>(null);
  const [textOverlay, setTextOverlay] = useState<TextConfig | null>(null);
  const [brandDefaultsApplied, setBrandDefaultsApplied] = useState(false);

  const mediaSrc = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const handleFile = (f: File) => {
    setMediaType(detectMediaType(f));
    setFile(f);
  };

  const reset = () => {
    setFile(null);
    setLogo(null);
    setTextOverlay(null);
    setBrandDefaultsApplied(false);
    setShowTranslateBar(false);
  };

  return (
    <ResizerContext.Provider
      value={{
        file, mediaType, mediaSrc, showSafeZones, showTranslateBar,
        logo, textOverlay, brandDefaultsApplied,
        setFile, handleFile, setShowSafeZones, setShowTranslateBar,
        setLogo, setTextOverlay, setBrandDefaultsApplied, reset,
      }}
    >
      {children}
    </ResizerContext.Provider>
  );
}
