import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ExternalLink, Plus, X, Eye, Search, Bookmark, Download, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
  impressions?: { lower_bound?: number; upper_bound?: number } | null;
}

interface DiscoveredPage {
  page_name: string;
  page_id: string;
  adCount: number;
  platforms: string[];
}

const USE_MOCK = false; // Disable mock to use real FB API

// Facebook SDK types
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

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
    impressions: { lower_bound: (i + 1) * 1200, upper_bound: (i + 1) * 3500 },
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
  const [isOAuthError, setIsOAuthError] = useState(false);
  // Add brand flow
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [searching, setSearching] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { t } = useI18n();

  const [fbAccessToken, setFbAccessToken] = useState<string | null>(localStorage.getItem("fb_access_token"));
  const [isFbConnected, setIsFbConnected] = useState<boolean>(!!localStorage.getItem("fb_access_token"));
  const [showApprovalNotice, setShowApprovalNotice] = useState(true);

  const handleFbLogin = () => {
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        localStorage.setItem("fb_access_token", token);
        setFbAccessToken(token);
        setIsFbConnected(true);
        toast({ title: t.brandAdded || "Facebook Connected" }); // Reusing translation key or add new one
      } else {
        toast({ title: "Facebook Connection Failed", variant: "destructive" });
      }
    }, { scope: 'ads_read,pages_show_list,business_management' }); // Requesting potential required scopes
  };

  const handleFbLogout = () => {
    localStorage.removeItem("fb_access_token");
    setFbAccessToken(null);
    setIsFbConnected(false);
    setAllAds([]);
    toast({ title: "Disconnected from Facebook" });
  };

  // Load all brands' ads on mount and when brands change
  const fetchAllAds = async () => {
    if (!fbAccessToken) return; // Wait for connection
    if (brands.length === 0) { setAllAds([]); setInitialLoaded(true); return; }
    setLoading(true);
    setError(null);

    // Mock handling moved or removed if not needed, focusing on FB API implementation
    if (USE_MOCK) {
      // ... existing mock logic ...
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
        // Direct Graph API call
        // Note: For Ads Library, we usually need to search the archive.
        // Endpoint: /ads_archive?search_terms=BRAND_NAME&ad_active_status=ALL&ad_reached_countries=['NL'] (adjust country as needed)
        // However, standard permissions might be restricted. If user implies "connected user token", 
        // they might be looking for THEIR account's ads or using the token to search public library.
        // The prompt said "search by page id: since its current login account only".

        // Let's assume using the token to search the Ads Library API (which requires validation) 
        // OR fetching ads for specific pages if successful.

        // Since we need to 'search by page id', we'll try to use the Page ID if available in the Ad Library endpoint
        // or fall back to name search if ID not present.

        console.log("BrandPageId is: ", brand.pageId);


        if (!brand.pageId) continue;

        console.log("BrandPageId is: ", brand.pageId);

        const fields = "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,ad_snapshot_url,currency,page_id,page_name,publisher_platforms";
        const url = `https://graph.facebook.com/v18.0/ads_archive?search_page_ids=${brand.pageId}&ad_active_status=ALL&fields=${fields}&access_token=${fbAccessToken}&limit=25`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          if (data.error.type === "OAuthException") {
            setIsOAuthError(true);
            throw new Error(data.error.message);
          }
          throw new Error(data.error.message);
        }

        if (data.data) {
          const mappedAds = data.data.map((ad: any) => ({
            id: ad.id,
            name: ad.page_name, // API doesn't always return ad name, using page name or text
            text: "Ad content unavailable in basic view", // Text often requires specific token permissions or fields
            snapshot_url: ad.ad_snapshot_url,
            image_url: "", // Need more complex parsing for images usually
            page_name: ad.page_name,
            page_id: ad.page_id,
            platform: ad.publisher_platforms?.join(", "),
            created_at: ad.ad_creation_time,
            stopped_at: ad.ad_delivery_stop_time,
            _brandId: brand.id
          }));
          results.push(...mappedAds);
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

  // Auto-load on mount if connected
  useEffect(() => {
    if (fbAccessToken) fetchAllAds();
  }, [brands.length, fbAccessToken]);

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

    if (!fbAccessToken) {
      toast({ title: "Please connect Facebook first", variant: "destructive" });
      setSearching(false);
      return;
    }

    try {
      console.log("facebook page is: ");
      // Search for Pages
      const response = await fetch(`https://graph.facebook.com/v18.0/pages/search?q=${trimmed}&fields=id,name,link,fan_count,verification_status&access_token=${fbAccessToken}`);
      const data = await response.json();

      if (data.error) {
        if (data.error.type === "OAuthException") {
          setIsOAuthError(true);
        }
        throw new Error(data.error.message);
      }

      // Map FB results to DiscoveredPage
      const pages = data.data.map((p: any) => ({
        page_name: p.name,
        page_id: p.id,
        adCount: 0, // Search endpoint doesn't give ad count directly
        platforms: ["facebook"] // Default assumption
      }));

      setDiscoveredPages(pages);
    } catch (err) {
      // toast({ title: t.translateError, variant: "destructive" });
      console.log("Yes it is working fine");
      setIsOAuthError(true);
      toast({ title: "Make sure your accout is approved", variant: "destructive" })

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
      {/* Account Approval Notice Modal */}
      {showApprovalNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-8">
            <button
              onClick={() => setShowApprovalNotice(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 rounded-xl bg-[#1877F2]/10 p-3">
                <Facebook className="h-6 w-6 text-[#1877F2]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Before You Start Searching</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Kindly make sure your Facebook account is <span className="font-medium text-foreground">approved</span> before searching for brands and ads. Without approval, search results may be restricted.
                </p>
                <a
                  href="https://www.facebook.com/help/contact/515009838910929"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1877F2] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verify if your account is approved
                </a>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowApprovalNotice(false)} className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white">
                I Understand, Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t.inspirationTitle}</h1>
              <p className="text-muted-foreground">{t.inspirationDescription}</p>
            </div>
            {!isFbConnected ? (
              <Button onClick={handleFbLogin} className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white gap-2">
                <Facebook className="h-4 w-4" /> Connect Facebook
              </Button>
            ) : (
              <Button onClick={handleFbLogout} variant="outline" className="gap-2">
                <Facebook className="h-4 w-4" /> Disconnect
              </Button>
            )}
          </div>
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
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.facebook.com/${page.page_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title={t.visitPage}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
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
            <AlertDescription className="text-destructive">
              {isOAuthError ? (
                <span>
                  Identity verification required. Please{" "}
                  <a
                    href="https://www.facebook.com/help/contact/515009838910929"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline hover:opacity-80"
                  >
                    approve your identity
                  </a>
                  {" "}on Facebook before continuing.
                </span>
              ) : (
                error
              )}
            </AlertDescription>
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
                    <button
                      onClick={() => {
                        if (!user) {
                          toast({ title: t.loginToSave, variant: "destructive" });
                          return;
                        }
                        toggleSave(ad).then((saved) => {
                          toast({ title: saved ? t.adSaved : t.adUnsaved });
                        });
                      }}
                      className="p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors"
                      title={isSaved(ad.id) ? t.adUnsave : t.adSave}
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved(ad.id) ? "fill-current" : ""}`} />
                    </button>
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
                  {ad.snapshot_url && (
                    <a href={ad.snapshot_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block mb-1">
                      {ad.snapshot_url}
                    </a>
                  )}
                  {ad.text && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{ad.text}</p>}
                  <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      {ad.platform && <span className="capitalize px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ad.platform}</span>}
                      {!ad.stopped_at ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">{t.active}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{t.stopped}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      {ad.created_at && (
                        <span>{t.activeSince} {new Date(ad.created_at).toLocaleDateString()}</span>
                      )}
                      {ad.impressions && ad.impressions.lower_bound != null && (
                        <span>{t.reach}: {ad.impressions.lower_bound.toLocaleString()}–{(ad.impressions.upper_bound ?? ad.impressions.lower_bound).toLocaleString()}</span>
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
