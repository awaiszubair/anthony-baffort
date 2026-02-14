import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SavedAd {
  id: string;
  ad_id: string;
}

export function useSavedAds() {
  const { user } = useAuth();
  const [savedAdIds, setSavedAdIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load saved ad IDs on mount
  useEffect(() => {
    if (!user) { setSavedAdIds(new Set()); return; }
    setLoading(true);
    supabase
      .from("saved_ads")
      .select("ad_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setSavedAdIds(new Set((data || []).map((d: SavedAd) => d.ad_id)));
        setLoading(false);
      });
  }, [user?.id]);

  const isSaved = useCallback((adId: string) => savedAdIds.has(adId), [savedAdIds]);

  const toggleSave = useCallback(async (ad: {
    id: string;
    name?: string;
    text?: string;
    page_name?: string;
    page_id?: string;
    platform?: string;
    image_url?: string;
    snapshot_url?: string;
  }) => {
    if (!user) return false;

    if (savedAdIds.has(ad.id)) {
      // Unsave
      await supabase.from("saved_ads").delete().eq("user_id", user.id).eq("ad_id", ad.id);
      setSavedAdIds((prev) => { const next = new Set(prev); next.delete(ad.id); return next; });
      return false;
    } else {
      // Save
      await supabase.from("saved_ads").insert({
        user_id: user.id,
        ad_id: ad.id,
        ad_name: ad.name || null,
        ad_text: ad.text || null,
        page_name: ad.page_name || null,
        page_id: ad.page_id || null,
        platform: ad.platform || null,
        image_url: ad.image_url || null,
        snapshot_url: ad.snapshot_url || null,
      });
      setSavedAdIds((prev) => new Set(prev).add(ad.id));
      return true;
    }
  }, [user, savedAdIds]);

  return { isSaved, toggleSave, loading };
}
