import { useState, useEffect } from "react";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

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

interface Brand {
  id: string;
  name: string;
  page_id: string | null;
}

const InspirationAds = () => {
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .order("name", { ascending: true });
      setBrands(data || []);
    };
    loadBrands();
  }, []);

  const fetchAds = async (brand: Brand) => {
    setLoading(true);
    setError(null);
    try {
      const res = await supabase.functions.invoke("meta-ad-library", {
        body: {
          search_query: brand.name,
          page_id: brand.page_id || undefined,
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

  useEffect(() => {
    if (brands.length > 0 && !selectedBrand) {
      const first = brands[0];
      setSelectedBrand(first.id);
      fetchAds(first);
    }
  }, [brands]);

  const handleBrandClick = (brand: Brand) => {
    setSelectedBrand(brand.id);
    fetchAds(brand);
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

        {/* Brand filter chips */}
        {brands.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Button
                key={brand.id}
                variant={selectedBrand === brand.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleBrandClick(brand)}
                disabled={loading}
              >
                {brand.name}
              </Button>
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-muted-foreground mb-3">
              No brands configured yet. Add brands in Settings to get started.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/settings">Go to Settings</a>
            </Button>
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
                {/* Snapshot iframe preview */}
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

        {!loading && ads.length === 0 && !error && brands.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ads found for this brand.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;
