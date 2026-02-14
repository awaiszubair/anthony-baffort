import { useState } from "react";
import { Loader2, AlertCircle, ExternalLink, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useTrackedBrands, type TrackedBrand } from "@/hooks/useTrackedBrands";
import { toast } from "@/hooks/use-toast";

interface MetaAd {
  id: string;
  name: string;
  text?: string;
  snapshot_url?: string;
  page_name?: string;
  platform?: string;
  created_at?: string;
  stopped_at?: string | null;
}

const InspirationAds = () => {
  const { brands, addBrand, removeBrand } = useTrackedBrands();
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPageId, setNewPageId] = useState("");

  const fetchAds = async (brand: TrackedBrand) => {
    setLoading(true);
    setError(null);
    setSelectedBrandId(brand.id);
    try {
      const res = await supabase.functions.invoke("meta-ad-library", {
        body: {
          search_query: brand.name,
          page_id: brand.pageId || undefined,
          limit: 25,
        },
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
    toast({ title: "Merk toegevoegd" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Inspiration Ads</h1>
          <p className="text-muted-foreground">
            Browse ad creatives from the brands you're tracking via Meta Ad Library.
          </p>
        </div>

        {/* Brand filter chips + add */}
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-0.5">
              <Button
                variant={selectedBrandId === brand.id ? "default" : "outline"}
                size="sm"
                onClick={() => fetchAds(brand)}
                disabled={loading}
              >
                {brand.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  removeBrand(brand.id);
                  if (selectedBrandId === brand.id) {
                    setAds([]);
                    setSelectedBrandId(null);
                  }
                  toast({ title: "Merk verwijderd" });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {showAddForm ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Merknaam"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-8 w-36 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
              />
              <Input
                placeholder="Page ID"
                value={newPageId}
                onChange={(e) => setNewPageId(e.target.value)}
                className="h-8 w-28 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddBrand()}
              />
              <Button size="sm" onClick={handleAddBrand} disabled={!newName.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewName(""); setNewPageId(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Merk toevoegen
            </Button>
          )}
        </div>

        {brands.length === 0 && !showAddForm && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground mb-3">
              Nog geen merken toegevoegd. Voeg een merk toe om advertenties te bekijken.
            </p>
          </div>
        )}

        {error && (
          <Alert className="mb-8 border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {ad.snapshot_url && (
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    <iframe
                      src={ad.snapshot_url}
                      className="w-full h-full border-0 pointer-events-none"
                      title={ad.name}
                      sandbox="allow-scripts allow-same-origin"
                    />
                    <a
                      href={ad.snapshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-card/80 hover:bg-card text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-foreground mb-1 line-clamp-2">
                    {ad.page_name || ad.name}
                  </h3>
                  {ad.text && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{ad.text}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {ad.platform && <span className="capitalize">{ad.platform}</span>}
                    <div className="flex gap-2">
                      {ad.created_at && <span>{new Date(ad.created_at).toLocaleDateString()}</span>}
                      {!ad.stopped_at && (
                        <span className="text-success font-medium">Active</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && ads.length === 0 && !error && selectedBrandId && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ads found for this brand.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;
