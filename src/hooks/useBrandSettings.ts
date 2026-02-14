import { useState, useCallback } from "react";

export interface BrandSettings {
  name: string;
  pageId: string;
  logoUrl: string | null;
  fontFamily: string;
}

const STORAGE_KEY = "brand-settings";

const defaultBrand: BrandSettings = {
  name: "",
  pageId: "",
  logoUrl: null,
  fontFamily: "DM Sans",
};

function loadBrand(): BrandSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBrand;
    return { ...defaultBrand, ...JSON.parse(raw) };
  } catch {
    return defaultBrand;
  }
}

export function useBrandSettings() {
  const [brand, setBrandState] = useState<BrandSettings>(loadBrand);

  const updateBrand = useCallback((patch: Partial<BrandSettings>) => {
    setBrandState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearBrand = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBrandState(defaultBrand);
  }, []);

  const hasBrand = !!brand.logoUrl || brand.fontFamily !== "DM Sans";

  return { brand, updateBrand, clearBrand, hasBrand };
}
