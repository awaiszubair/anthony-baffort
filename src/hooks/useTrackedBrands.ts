import { useState, useCallback } from "react";

export interface TrackedBrand {
  id: string;
  name: string;
  pageId: string;
}

const STORAGE_KEY = "tracked-brands";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadBrands(): TrackedBrand[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveBrands(brands: TrackedBrand[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
}

export function useTrackedBrands() {
  const [brands, setBrands] = useState<TrackedBrand[]>(loadBrands);

  const addBrand = useCallback((name: string, pageId: string) => {
    setBrands((prev) => {
      const next = [...prev, { id: generateId(), name: name.trim(), pageId: pageId.trim() }];
      saveBrands(next);
      return next;
    });
  }, []);

  const removeBrand = useCallback((id: string) => {
    setBrands((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveBrands(next);
      return next;
    });
  }, []);

  return { brands, addBrand, removeBrand };
}
