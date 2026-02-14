import { useState } from "react";
import { Loader2, AlertCircle, ExternalLink, Plus, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedBrands, type TrackedBrand } from "@/hooks/useTrackedBrands";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface MetaAd {
  id: string;
  name: string;
  text?: string;
  snapshot_url?: string;
  image_url?: string;
  page_name?: string;
  platform?: string;
  created_at?: string;
  stopped_at?: string | null;
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
    platform: platforms[i % platforms.length],
    created_at: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
    stopped_at: i === 3 ? new Date().toISOString() : null,
    image_url: `gradient:${colors[i]}`,
  }));
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
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPageId, setNewPageId] = useState("");
  const { t } = useI18n();

  const fetchAds = async (brand: TrackedBrand) => {
    setLoading(true);
    setError(null);
    setSelectedBrandId(brand.id);
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      setAds(generateMockAds(brand.name));
      setLoading(false);
      return;
    }
    try {
      const res = await supabase.functions.invoke("meta-ad-library", {
        body: { search_query: brand.name, page_id: brand.pageId || undefined, limit: 25 },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setAds(res.data?.ads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ads");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addBrand(trimmed, newPageId.trim());
    setNewName("");
    setNewPageId("");
    setShowAddForm(false);
    toast({ title: t.brandAdded });
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
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-0.5">
              <Button variant={selectedBrandId === brand.id ? "default" : "outline"} size="sm" onClick={() => fetchAds(brand)} disabled={loading}>
                {brand.name}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => { removeBrand(brand.id); if (selectedBrandId === brand.id) { setAds([]); setSelectedBrandId(null); } toast({ title: t.brandRemoved }); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {showAddForm ? (
            <div className="flex items-center gap-2">
              <Input placeholder={t.brandName} value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 w-36 text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && handleAddBrand()} />
              <Input placeholder="Page ID" value={newPageId} onChange={(e) => setNewPageId(e.target.value)} className="h-8 w-28 text-sm" onKeyDown={(e) => e.key === "Enter" && handleAddBrand()} />
              <Button size="sm" onClick={handleAddBrand} disabled={!newName.trim()}><Plus className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewName(""); setNewPageId(""); }}><X className="h-3.5 w-3.5" /></Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {t.addBrand}
            </Button>
          )}
        </div>

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

        {brands.length > 0 && !selectedBrandId && !loading && ads.length === 0 && (
          <div className="text-center py-12"><p className="text-muted-foreground">{t.selectBrandPrompt}</p></div>
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

        {!loading && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {ad.snapshot_url ? (
                    <iframe src={ad.snapshot_url} className="w-full h-full border-0 pointer-events-none" title={ad.name} sandbox="allow-scripts allow-same-origin" />
                  ) : ad.image_url?.startsWith("gradient:") ? (
                    <MockAdImage gradient={ad.image_url.replace("gradient:", "")} name={ad.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Eye className="h-8 w-8" /></div>
                  )}
                  {ad.snapshot_url && (
                    <a href={ad.snapshot_url} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors opacity-0 group-hover:opacity-100">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
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

        {!loading && ads.length === 0 && !error && selectedBrandId && (
          <div className="text-center py-12"><p className="text-muted-foreground">{t.noAdsFound}</p></div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;
