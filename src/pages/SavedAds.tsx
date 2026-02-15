import { useState, useEffect } from "react";
import { Loader2, Bookmark, Trash2, ExternalLink, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface SavedAdRow {
  id: string;
  ad_id: string;
  ad_name: string | null;
  ad_text: string | null;
  page_name: string | null;
  page_id: string | null;
  platform: string | null;
  image_url: string | null;
  snapshot_url: string | null;
  stored_media_url: string | null;
  created_at: string;
}

const SavedAds = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [ads, setAds] = useState<SavedAdRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedAds = async () => {
    if (!user) { setAds([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("saved_ads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAds((data as SavedAdRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSavedAds(); }, [user?.id]);

  const removeAd = async (adId: string) => {
    if (!user) return;
    // Delete stored media
    const ad = ads.find(a => a.ad_id === adId);
    if (ad?.stored_media_url) {
      const path = ad.stored_media_url.split("/saved-ad-media/")[1];
      if (path) {
        await supabase.storage.from("saved-ad-media").remove([path]);
      }
    }
    await supabase.from("saved_ads").delete().eq("user_id", user.id).eq("ad_id", adId);
    setAds(prev => prev.filter(a => a.ad_id !== adId));
    toast({ title: t.adUnsaved });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">{t.loginToSave}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.savedAdsTitle}</h1>
          <p className="text-muted-foreground">{t.savedAdsDescription}</p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && ads.length === 0 && (
          <div className="text-center py-12">
            <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">{t.noSavedAds}</p>
            <p className="text-sm text-muted-foreground">{t.noSavedAdsDescription}</p>
          </div>
        )}

        {!loading && ads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ads.map((ad) => {
              const displayUrl = ad.stored_media_url || ad.image_url;
              const isGradient = displayUrl?.startsWith("gradient:");

              return (
                <div key={ad.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    {displayUrl && !isGradient ? (
                      <img src={displayUrl} alt={ad.ad_name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeAd(ad.ad_id)}
                        className="p-1.5 rounded-md bg-card/80 hover:bg-destructive hover:text-destructive-foreground text-foreground transition-colors"
                        title={t.adUnsave}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {displayUrl && !isGradient && (
                        <a href={displayUrl} download target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors"
                          title={t.downloadAd}>
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                      {ad.snapshot_url && (
                        <a href={ad.snapshot_url} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    {ad.stored_media_url && (
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/80 text-primary-foreground font-medium">
                          {t.mediaCopied}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-foreground mb-1 line-clamp-2">{ad.page_name || ad.ad_name || "Ad"}</h3>
                    {ad.ad_text && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{ad.ad_text}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      {ad.platform && <span className="capitalize px-2 py-0.5 rounded-full bg-muted">{ad.platform}</span>}
                      <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedAds;
