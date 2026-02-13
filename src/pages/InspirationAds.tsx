import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MetaAd {
  id: string;
  name: string;
  image_url?: string;
  preview_url?: string;
  text?: string;
  platform?: string;
  created_at?: string;
}

const InspirationAds = () => {
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/meta-ad-library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          search_query: searchQuery || "design",
          limit: 20,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ads: ${response.statusText}`);
      }

      const data = await response.json();
      setAds(data.ads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ads");
      console.error("Error fetching ads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Inspiration Ads</h1>
          <p className="text-muted-foreground">
            Discover creative ad examples from Meta's Ad Library to inspire your campaigns.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex gap-4">
          <input
            type="text"
            placeholder="Search ads (e.g., design, marketing, tech)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={fetchAds} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert className="mb-8 border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Ads Grid */}
        {!loading && ads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {ad.image_url && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={ad.image_url}
                      alt={ad.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                    {ad.name}
                  </h3>
                  {ad.text && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {ad.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {ad.platform && <span className="capitalize">{ad.platform}</span>}
                    {ad.created_at && (
                      <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && ads.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No ads found. Try searching for different keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;
