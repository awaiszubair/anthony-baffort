import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ExternalLink, Plus, X, Eye, Search, Bookmark, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedBrands, type TrackedBrand } from "@/hooks/useTrackedBrands";
import { useSavedAds } from "@/hooks/useSavedAds";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface MetaAd {
  id: string;
  name: string;
  text?: string;
  snapshot_url?: string;
  image_url?: string;
  page_name?: string;
  page_id?: string;
  platform?: string;
  created_at?: string;
  stopped_at?: string | null;
}

interface DiscoveredPage {
  page_name: string;
  page_id: string;
  adCount: number;
  platforms: string[];
}

const USE_MOCK = true;

function generateMockAds(brandName: string): MetaAd[] {
  const platforms = ["facebook", "instagram", "instagram", "facebook"];
  const adTypes = [
    { text: `Ontdek de nieuwe ${brandName} collectie. Tijdloze stukken voor elk seizoen. Shop nu met gratis verzending.`, name: "New Collection Launch" },
    { text: `${brandName} Summer Sale — tot 50% korting op geselecteerde items. Alleen dit weekend!`, name: "Summer Sale Campaign" },
    { text: `Maak kennis met ${brandName}. Kwaliteit die je voelt, design dat je ziet. Bekijk de lookbook.`, name: "Brand Awareness" },
    { text: `De ${brandName} bestsellers zijn terug op voorraad. Wees er snel bij — op is op.`, name: "Restock Alert" },
    { text: `Nieuw van ${brandName}: duurzame materialen, moderne silhouetten. Ontdek het nu.`, name: "Sustainable Line" },
    { text: `${brandName} x Artist Collab — Limited edition prints, nu exclusief verkrijgbaar.`, name: "Collaboration Drop" },
    { text: `Gratis retourneren bij ${brandName}. Probeer thuis, zonder risico. Bestel vandaag.`, name: "Free Returns Promo" },
    { text: `Word lid van de ${brandName} community. Early access, exclusieve deals en meer.`, name: "Loyalty Program" },
    { text: `${brandName} Winter Essentials — warme lagen, koele stijl. Shop de collectie.`, name: "Winter Campaign" },
  ];
  const colors = [
    "from-rose-400 to-orange-300", "from-blue-400 to-cyan-300", "from-violet-400 to-purple-300",
    "from-emerald-400 to-teal-300", "from-amber-400 to-yellow-300", "from-pink-400 to-fuchsia-300",
    "from-sky-400 to-indigo-300", "from-lime-400 to-green-300", "from-red-400 to-rose-300",
  ];
  return adTypes.map((ad, i) => ({
    id: `mock-${brandName}-${i}`, name: ad.name, text: ad.text, page_name: brandName,
    page_id: `${1000000 + Math.floor(Math.random() * 9000000)}`,
    platform: platforms[i % platforms.length],
    created_at: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
    stopped_at: i === 3 ? new Date().toISOString() : null,
    image_url: `gradient:${colors[i]}`,
  }));
}

function generateMockPages(brandName: string): DiscoveredPage[] {
  const lower = brandName.toLowerCase();
  return [
    { page_name: brandName, page_id: "1234567890", adCount: 47, platforms: ["facebook", "instagram"] },
    { page_name: `${brandName} ${lower === "nike" ? "Running" : "Official"}`, page_id: "9876543210", adCount: 12, platforms: ["facebook"] },
    { page_name: `${brandName} ${lower === "nike" ? "Football" : "Store"}`, page_id: "5555555555", adCount: 8, platforms: ["instagram"] },
  ];
}

const MockAdImage = ({ gradient, name }: { gradient: string; name: string }) => (
  <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center p-6`}>
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
      <p className="text-white font-bold text-lg drop-shadow-md">{name}</p>
    </div>
  </div>
);

const InspirationAds = () => {
  const { brands, addBrand, removeBrand } = useTrackedBrands();
  const { isSaved, toggleSave } = useSavedAds();
  const { user } = useAuth();
  const [allAds, setAllAds] = useState<MetaAd[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add brand flow
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [searching, setSearching] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { t } = useI18n();

  // Load all brands' ads on mount and when brands change
  const fetchAllAds = async () => {
    if (brands.length === 0) { setAllAds([]); setInitialLoaded(true); return; }
    setLoading(true);
    setError(null);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const combined = brands.flatMap((b) => generateMockAds(b.name));
      setAllAds(combined);
      setLoading(false);
      setInitialLoaded(true);
      return;
    }

    try {
      const results: MetaAd[] = [];
      for (const brand of brands) {
        const res = await supabase.functions.invoke("meta-ad-library", {
          body: { search_query: brand.name, page_id: brand.pageId || undefined, limit: 25 },
        });
        if (res.data?.ads) {
          results.push(...res.data.ads.map((ad: MetaAd) => ({ ...ad, _brandId: brand.id })));
        }
      }
      setAllAds(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ads");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  // Auto-load on mount
  useEffect(() => { fetchAllAds(); }, [brands.length]);

  // Filter ads by selected brand
  const filteredAds = selectedBrandId
    ? allAds.filter((ad) => {
        const brand = brands.find((b) => b.id === selectedBrandId);
        return brand && ad.page_name?.toLowerCase() === brand.name.toLowerCase();
      })
    : allAds;

  const searchPages = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSearching(true);
    setDiscoveredPages([]);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 800));
      setDiscoveredPages(generateMockPages(trimmed));
      setSearching(false);
      return;
    }

    try {
      const res = await supabase.functions.invoke("meta-ad-library", {
        body: { search_query: trimmed, limit: 50 },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      // Extract unique pages from ad results
      const pageMap = new Map<string, DiscoveredPage>();
      for (const ad of res.data?.ads || []) {
        if (!ad.page_id || !ad.page_name) continue;
        const existing = pageMap.get(ad.page_id);
        if (existing) {
          existing.adCount++;
          if (ad.platform) {
            for (const p of ad.platform.split(", ")) {
              if (!existing.platforms.includes(p)) existing.platforms.push(p);
            }
          }
        } else {
          pageMap.set(ad.page_id, {
            page_name: ad.page_name,
            page_id: ad.page_id,
            adCount: 1,
            platforms: ad.platform ? ad.platform.split(", ") : [],
          });
        }
      }
      setDiscoveredPages(Array.from(pageMap.values()).sort((a, b) => b.adCount - a.adCount));
    } catch (err) {
      toast({ title: t.translateError, variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const selectPage = (page: DiscoveredPage) => {
    addBrand(page.page_name, page.page_id);
    toast({ title: t.brandAdded });
    resetAddForm();
    // Reload ads to include the new brand
    setTimeout(() => fetchAllAds(), 100);
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName("");
    setDiscoveredPages([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.inspirationTitle}</h1>
          <p className="text-muted-foreground">{t.inspirationDescription}</p>
        </div>

        {/* Brand filter chips + add */}
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          {brands.length > 1 && (
            <Button variant={selectedBrandId === null ? "default" : "outline"} size="sm" onClick={() => setSelectedBrandId(null)} disabled={loading}>
              {t.allBrands}
            </Button>
          )}
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-0.5">
              <Button variant={selectedBrandId === brand.id ? "default" : "outline"} size="sm" onClick={() => setSelectedBrandId(brand.id)} disabled={loading}>
                {brand.name}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => { removeBrand(brand.id); if (selectedBrandId === brand.id) setSelectedBrandId(null); fetchAllAds(); toast({ title: t.brandRemoved }); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {!showAddForm && (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t.addBrand}
            </Button>
          )}
        </div>

        {/* Add brand flow */}
        {showAddForm && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t.addBrand}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetAddForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Step 1: Search */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder={t.brandName}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm max-w-xs"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && searchPages()}
              />
              <Button size="sm" onClick={searchPages} disabled={!newName.trim() || searching} className="gap-1.5">
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t.searchPages}
              </Button>
            </div>

            {/* Step 2: Select page */}
            {discoveredPages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">{t.selectPage}</p>
                {discoveredPages.map((page) => (
                  <button
                    key={page.page_id}
                    onClick={() => selectPage(page)}
                    className="w-full text-left rounded-lg border border-border bg-background px-4 py-3 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{page.page_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.adCount} {t.adsFound} · {page.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{page.page_id}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.searchingPages}
              </div>
            )}

            {!searching && discoveredPages.length === 0 && newName.trim() && (
              <p className="text-xs text-muted-foreground">{t.searchPagesHint}</p>
            )}
          </div>
        )}

        {brands.length === 0 && !showAddForm && (
          <div className="mb-8 rounded-lg border border-border bg-card p-8 text-center">
            <Eye className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">{t.noBrandsYet}</p>
            <p className="text-sm text-muted-foreground mb-4">{t.noBrandsDescription}</p>
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t.addFirstBrand}
            </Button>
          </div>
        )}

        {brands.length > 0 && initialLoaded && !loading && filteredAds.length === 0 && !error && (
          <div className="text-center py-12"><p className="text-muted-foreground">{t.noAdsFound}</p></div>
        )}

        {error && (
          <Alert className="mb-8 border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        )}

        {!loading && filteredAds.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {ad.snapshot_url ? (
                    <iframe src={ad.snapshot_url} className="w-full h-full border-0 pointer-events-none" title={ad.name} sandbox="allow-scripts allow-same-origin" />
                  ) : ad.image_url?.startsWith("gradient:") ? (
                    <MockAdImage gradient={ad.image_url.replace("gradient:", "")} name={ad.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Eye className="h-8 w-8" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {user && (
                      <button
                        onClick={() => {
                          toggleSave(ad).then((saved) => {
                            toast({ title: saved ? t.adSaved : t.adUnsaved });
                          });
                        }}
                        className="p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors"
                        title={isSaved(ad.id) ? t.adUnsave : t.adSave}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved(ad.id) ? "fill-current" : ""}`} />
                      </button>
                    )}
                    {(ad.image_url && !ad.image_url.startsWith("gradient:")) && (
                      <a href={ad.image_url} download target="_blank" rel="noopener noreferrer"
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
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-foreground mb-1 line-clamp-2">{ad.page_name || ad.name}</h3>
                  {ad.text && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{ad.text}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {ad.platform && <span className="capitalize px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ad.platform}</span>}
                    <div className="flex items-center gap-2">
                      {ad.created_at && <span>{new Date(ad.created_at).toLocaleDateString()}</span>}
                      {!ad.stopped_at ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{t.active}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t.stopped}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAds.length === 0 && !error && selectedBrandId && initialLoaded && (
          <div className="text-center py-12"><p className="text-muted-foreground">{t.noAdsFound}</p></div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;
