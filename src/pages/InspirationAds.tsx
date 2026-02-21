import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, ExternalLink, Plus, X, Eye, Search, Bookmark, Facebook } from "lucide-react";
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
  hasMore?: boolean;
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
    { page_name: brandName, page_id: "1234567890", adCount: 47, platforms: ["facebook", "instagram"], hasMore: true },
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

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [searching, setSearching] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  // Ref always mirrors discoveredPages so async loops never see stale state
  const discoveredPagesRef = useRef<DiscoveredPage[]>([]);
  const [pageCursor, setPageCursor] = useState<string | null>(null);
  const pageCursorRef = useRef<string | null>(null);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const { t } = useI18n();

  // ── Ads-level pagination ──────────────────────────────────────────
  const [adsCursor, setAdsCursor] = useState<string | null>(null);
  const [hasMoreAds, setHasMoreAds] = useState(false);
  const [loadingMoreAds, setLoadingMoreAds] = useState(false);
  // ─────────────────────────────────────────────────────────────────

  const [fbAccessToken, setFbAccessToken] = useState<string | null>(localStorage.getItem("fb_access_token"));
  const [isFbConnected, setIsFbConnected] = useState<boolean>(!!localStorage.getItem("fb_access_token"));

  // Key that marks "this token has made at least one successful ads_archive call"
  const verificationKey = fbAccessToken
    ? `fb_ads_archive_success_${fbAccessToken.substring(0, 20)}`
    : null;

  // Show popup if connected but we have NEVER had a successful API call with this token
  const [showApprovalNotice, setShowApprovalNotice] = useState<boolean>(() => {
    if (!fbAccessToken || !verificationKey) return false;
    return !localStorage.getItem(verificationKey);
  });

  const handleFbLogin = () => {
    window.FB.login((response: any) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;           // ← production
        // const token = "EAAKePanQMckBQ6uxBft5QVXN8QoVXSWwpbWLP9SBcr7YCBzBYUC5ej1bfioqdyflFVRYy5uamOe6bPkrw7OzFZBYBKChPeyD6cxKLF5gRNxJgNclO6RJ7ZBWl1iwfaFdlhpFCqcUHOkQey9mfud0CYOGliigLOrgeZAoirW4czX11eWVX0ZCmChaFriLUHHy"; // ← testing only

        localStorage.setItem("fb_access_token", token);
        setFbAccessToken(token);
        setIsFbConnected(true);

        // New token → check if already proven successful before
        const newKey = `fb_ads_archive_success_${token.substring(0, 20)}`;
        const alreadySuccessful = !!localStorage.getItem(newKey);
        setShowApprovalNotice(!alreadySuccessful);

        toast({ title: t.brandAdded || "Facebook Connected" });
      } else {
        toast({ title: "Facebook Connection Failed", variant: "destructive" });
      }
    }, { scope: 'ads_read,pages_show_list,business_management' });
  };

  const handleFbLogout = () => {
    localStorage.removeItem("fb_access_token");
    setFbAccessToken(null);
    setIsFbConnected(false);
    setAllAds([]);
    setAdsCursor(null);
    setHasMoreAds(false);
    setShowApprovalNotice(false);
    toast({ title: "Disconnected from Facebook" });
  };

  // User closes/acknowledges popup — we do NOT set success here
  const acknowledgeNotice = () => {
    setShowApprovalNotice(false);
  };

  // Call this ONLY after a successful (200) ads_archive response
  const markApiSuccess = () => {
    if (verificationKey) {
      localStorage.setItem(verificationKey, "true");
      setShowApprovalNotice(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Fetch ads (initial load for all tracked brands)
  // ─────────────────────────────────────────────────────────────────
  const fetchAllAds = async () => {
    if (!fbAccessToken) return;
    if (brands.length === 0) { setAllAds([]); setInitialLoaded(true); return; }

    setLoading(true);
    setError(null);
    setAdsCursor(null);
    setHasMoreAds(false);

    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const combined = brands.flatMap((b) => generateMockAds(b.name));
      setAllAds(combined);
      setLoading(false);
      setInitialLoaded(true);
      markApiSuccess();
      return;
    }

    try {
      const results: MetaAd[] = [];
      let lastCursor: string | null = null;
      let lastHasMore = false;

      for (const brand of brands) {
        if (!brand.pageId) continue;

        const COUNTRIES = "US,GB,CA,AU,DE,FR,NL,AE,SA,PK,IN,BR,MX,ES,IT,PL,SE,NO,DK,BE";
        const fields = "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,currency,page_id,page_name,publisher_platforms,impressions,spend";

        const url = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(brand.name)}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES.split(',').map(c => `"${c}"`).join(',')}]&fields=${fields}&access_token=${fbAccessToken}&limit=25`;

        const response = await fetch(url);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (errData.error?.type === "OAuthException") {
            setIsOAuthError(true);
          }
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.data) {
          const mappedAds = data.data.map((ad: any) => ({
            id: ad.id,
            name: ad.page_name || "Ad",
            text: ad.ad_creative_bodies?.[0] || ad.ad_creative_link_titles?.[0] || "",
            snapshot_url: ad.ad_snapshot_url,
            image_url: "",
            page_name: ad.page_name,
            page_id: ad.page_id,
            platform: ad.publisher_platforms?.join(", ") || "facebook",
            created_at: ad.ad_creation_time,
            stopped_at: ad.ad_delivery_stop_time,
            impressions: ad.impressions,
            _brandId: brand.id,
          }));
          results.push(...mappedAds);

          // Store cursor from the last brand's response for ads-level pagination
          if (data.paging?.cursors?.after) {
            lastCursor = data.paging.cursors.after;
            lastHasMore = !!data.paging?.next;
          }
        }
      }

      setAllAds(results);
      setAdsCursor(lastCursor);
      setHasMoreAds(lastHasMore);
      markApiSuccess();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ads");
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Load more ads (ads-level pagination, appends to existing ads)
  // ─────────────────────────────────────────────────────────────────
  const fetchMoreAds = async () => {
    if (!fbAccessToken || !adsCursor) return;

    const activeBrands = selectedBrandId
      ? brands.filter((b) => b.id === selectedBrandId)
      : brands;

    if (activeBrands.length === 0) return;

    setLoadingMoreAds(true);

    try {
      const brand = activeBrands[0]; // paginate against the first relevant brand
      const COUNTRIES = "US,GB,CA,AU,DE,FR,NL,AE,SA,PK,IN,BR,MX,ES,IT,PL,SE,NO,DK,BE";
      const fields = "id,ad_creation_time,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_descriptions,ad_creative_link_titles,ad_snapshot_url,currency,page_id,page_name,publisher_platforms,impressions,spend";

      const url = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(brand.name)}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES.split(',').map(c => `"${c}"`).join(',')}]&fields=${fields}&access_token=${fbAccessToken}&limit=25&after=${encodeURIComponent(adsCursor)}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.error?.type === "OAuthException") setIsOAuthError(true);
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.data) {
        const mappedAds: MetaAd[] = data.data.map((ad: any) => ({
          id: ad.id,
          name: ad.page_name || "Ad",
          text: ad.ad_creative_bodies?.[0] || ad.ad_creative_link_titles?.[0] || "",
          snapshot_url: ad.ad_snapshot_url,
          image_url: "",
          page_name: ad.page_name,
          page_id: ad.page_id,
          platform: ad.publisher_platforms?.join(", ") || "facebook",
          created_at: ad.ad_creation_time,
          stopped_at: ad.ad_delivery_stop_time,
          impressions: ad.impressions,
          _brandId: brand.id,
        }));

        // Append new ads without duplicates
        setAllAds((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const fresh = mappedAds.filter((a) => !existingIds.has(a.id));
          return [...prev, ...fresh];
        });
      }

      setAdsCursor(data.paging?.cursors?.after ?? null);
      setHasMoreAds(!!data.paging?.next);
      markApiSuccess();
    } catch (err) {
      toast({ title: "Error loading more ads", variant: "destructive" });
    } finally {
      setLoadingMoreAds(false);
    }
  };

  useEffect(() => {
    if (fbAccessToken) fetchAllAds();
  }, [brands.length, fbAccessToken]);

  const filteredAds = selectedBrandId
    ? allAds.filter((ad) => {
      const brand = brands.find((b) => b.id === selectedBrandId);
      return brand && ad.page_name?.toLowerCase() === brand.name.toLowerCase();
    })
    : allAds;

  // Keep refs in sync so async loops always see fresh values
  useEffect(() => { discoveredPagesRef.current = discoveredPages; }, [discoveredPages]);

  // ─────────────────────────────────────────────────────────────────
  // Search pages (page-level pagination)
  //
  // ROOT-CAUSE of the "3rd click" bug:
  //   Facebook's ads_archive returns ADS, not pages. A single batch of
  //   20 ads can all belong to the same 1-3 page_ids that are already
  //   shown. The previous code fetched one batch, found nothing new,
  //   and silently stopped — leaving the button visible but doing nothing
  //   visually for the user.
  //
  // FIX: when isLoadMore=true, loop through API batches automatically
  //   until we find ≥1 genuinely new page OR the API has no more data.
  //   That way a single user click always produces a visible result.
  // ─────────────────────────────────────────────────────────────────
  // const searchPages = async (isLoadMore = false) => {
  //   const trimmed = newName.trim();
  //   if (!trimmed) return;

  //   if (!isLoadMore) {
  //     setSearching(true);
  //     discoveredPagesRef.current = [];
  //     setDiscoveredPages([]);
  //     pageCursorRef.current = null;
  //     setPageCursor(null);
  //     setHasMorePages(false);
  //   } else {
  //     setLoadingMore(true);
  //   }

  //   if (!fbAccessToken) {
  //     toast({ title: "Please connect Facebook first", variant: "destructive" });
  //     setSearching(false);
  //     setLoadingMore(false);
  //     return;
  //   }

  //   const COUNTRIES = "US,GB,CA,AU,DE,FR,NL,AE,SA,PK,IN,BR,MX,ES,IT,PL,SE,NO,DK,BE";
  //   const fields = "page_id,page_name,publisher_platforms";

  //   // For load-more: keep looping through API cursor pages until we
  //   // surface at least one page_id the user hasn't seen yet.
  //   let activeCursor: string | null = isLoadMore ? pageCursorRef.current : null;
  //   let foundNewPages = false;
  //   let apiHasMore = false;
  //   let nextCursor: string | null = null;
  //   let newPages: DiscoveredPage[] = [];

  //   try {
  //     do {
  //       let url = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(
  //         trimmed
  //       )}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES
  //         .split(',')
  //         .map((c) => `"${c}"`)
  //         .join(',')}]&fields=${fields}&access_token=${fbAccessToken}&limit=20`;

  //       if (activeCursor) {
  //         url += `&after=${encodeURIComponent(activeCursor)}`;
  //       }

  //       const response = await fetch(url);
  //       if (!response.ok) {
  //         const errData = await response.json().catch(() => ({}));
  //         if (errData.error?.type === "OAuthException" && errData.error?.code == 1) setIsOAuthError(true);
  //         toast({ title: "Kindly make Sure Your Account Meta Approved", variant: "destructive" });
  //         throw new Error(errData.error?.message || `HTTP ${response.status}`);
  //       }

  //       const data = await response.json();

  //       // Advance cursor tracking (use ref so outer loop always gets fresh value)
  //       nextCursor = data.paging?.cursors?.after ?? null;
  //       apiHasMore = !!data.paging?.next;
  //       activeCursor = nextCursor;

  //       // Collect new pages from this batch.
  //       // KEY FIX: group by page_name (case-insensitive) instead of page_id.
  //       // Facebook returns multiple pages with the SAME display name but
  //       // different page_ids (e.g. regional Nike Football pages). Keying by
  //       // page_id caused them to appear as separate list entries. Keying by
  //       // name merges them into one entry — restoring the original behaviour.
  //       if (data.data && Array.isArray(data.data)) {
  //         // Build known-name set from current ref (always fresh inside loop)
  //         const knownNames = new Set(
  //           discoveredPagesRef.current.map((p) => p.page_name.toLowerCase())
  //         );
  //         // newPageMap keyed by lowercase page_name
  //         const newPageMap = new Map<string, DiscoveredPage>();

  //         for (const ad of data.data) {
  //           if (!ad.page_id) continue;
  //           const nameKey = (ad.page_name ?? trimmed).toLowerCase();

  //           if (knownNames.has(nameKey)) {
  //             // Already in the discovered list — skip (don't duplicate)
  //             continue;
  //           }

  //           if (newPageMap.has(nameKey)) {
  //             // Same name seen again in this batch → merge into one entry
  //             const entry = newPageMap.get(nameKey)!;
  //             entry.adCount += 1;
  //             ad.publisher_platforms?.forEach((p: string) => {
  //               if (!entry.platforms.includes(p)) entry.platforms.push(p);
  //             });
  //           } else {
  //             // Brand-new page name → create entry (use first page_id encountered)
  //             newPageMap.set(nameKey, {
  //               page_name: ad.page_name ?? trimmed,
  //               page_id: ad.page_id,
  //               adCount: 1,
  //               platforms: ad.publisher_platforms ?? ["facebook"],
  //             });
  //           }
  //         }

  //         if (newPageMap.size > 0) {
  //           const freshPages = Array.from(newPageMap.values());
  //           // Update ref immediately so the next loop iteration sees these names
  //           discoveredPagesRef.current = [...discoveredPagesRef.current, ...freshPages];
  //           newPages.push(...freshPages);
  //           foundNewPages = true;
  //         }
  //       }

  //       // Keep looping only when: load-more mode, no new pages yet, API has more
  //     } while (isLoadMore && !foundNewPages && apiHasMore);

  //     // Update ad counts and platforms for new pages
  //     if (newPages.length > 0) {
  //       await Promise.all(
  //         newPages.map(async (page) => {
  //           try {
  //             const countFields = "publisher_platforms";
  //             const countUrl = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(
  //               page.page_name
  //             )}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES
  //               .split(',')
  //               .map((c) => `"${c}"`)
  //               .join(',')}]&fields=${countFields}&access_token=${fbAccessToken}&limit=25`;

  //             const countResponse = await fetch(countUrl);
  //             if (!countResponse.ok) {
  //               return; // Keep original values on error
  //             }

  //             const countData = await countResponse.json();
  //             if (countData.data) {
  //               page.adCount = countData.data.length;

  //               const platformsSet = new Set(page.platforms);
  //               countData.data.forEach((ad: any) => {
  //                 ad.publisher_platforms?.forEach((p: string) => platformsSet.add(p));
  //               });
  //               page.platforms = Array.from(platformsSet);

  //               page.hasMore = countData.data.length === 25 && !!countData.paging?.next;
  //             }
  //           } catch (err) {
  //             console.error(`Error fetching ad count for page ${page.page_id}:`, err);
  //           }
  //         })
  //       );

  //       setDiscoveredPages([...discoveredPagesRef.current]);
  //     }

  //     // Commit final cursor + hasMore state
  //     pageCursorRef.current = nextCursor;
  //     setPageCursor(nextCursor);
  //     setHasMorePages(apiHasMore);
  //     markApiSuccess();

  //   } catch (err) {
  //     console.error("Page search error:", err);
  //     toast({ title: "Error loading pages", variant: "destructive" });
  //   } finally {
  //     setSearching(false);
  //     setLoadingMore(false);
  //   }
  // };
  const searchPages = async (isLoadMore = false) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (!isLoadMore) {
      setSearching(true);
      discoveredPagesRef.current = [];
      setDiscoveredPages([]);
      pageCursorRef.current = null;
      setPageCursor(null);
      setHasMorePages(false);
    } else {
      setLoadingMore(true);
    }

    if (!fbAccessToken) {
      toast({ title: "Please connect Facebook first", variant: "destructive" });
      setSearching(false);
      setLoadingMore(false);
      return;
    }

    const COUNTRIES = "US,GB,CA,AU,DE,FR,NL,AE,SA,PK,IN,BR,MX,ES,IT,PL,SE,NO,DK,BE";
    const fields = "page_id,page_name,publisher_platforms";

    let activeCursor: string | null = isLoadMore ? pageCursorRef.current : null;
    let foundNewPages = false;
    let apiHasMore = false;
    let nextCursor: string | null = null;
    let newPages: DiscoveredPage[] = [];
    let authErrorOccurred = false;

    try {
      do {
        let url = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(
          trimmed
        )}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES
          .split(',')
          .map((c) => `"${c}"`)
          .join(',')}]&fields=${fields}&access_token=${fbAccessToken}&limit=20`;

        if (activeCursor) {
          url += `&after=${encodeURIComponent(activeCursor)}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          let errData;
          try {
            errData = await response.json();
          } catch {
            errData = {};
          }

          const errorCode = errData?.error?.code;
          const errorType = errData?.error?.type;

          if (errorType === "OAuthException") {
            setIsOAuthError(true);

            if (errorCode === 1 || errorCode === 200 || errorCode === 10 || errorCode === 368) {
              // Common codes for: not verified, permission issue, rate limit, account restricted
              authErrorOccurred = true;
            }
          }

          // Don't throw here — continue to show better message at the end
          console.error("Ads archive batch failed:", errData);
          break; // Stop pagination on auth/permission error
        }

        const data = await response.json();

        nextCursor = data.paging?.cursors?.after ?? null;
        apiHasMore = !!data.paging?.next;
        activeCursor = nextCursor;

        if (data.data && Array.isArray(data.data)) {
          const knownNames = new Set(
            discoveredPagesRef.current.map((p) => p.page_name.toLowerCase())
          );
          const newPageMap = new Map<string, DiscoveredPage>();

          for (const ad of data.data) {
            if (!ad.page_id) continue;
            const nameKey = (ad.page_name ?? trimmed).toLowerCase();

            if (knownNames.has(nameKey)) continue;

            if (newPageMap.has(nameKey)) {
              const entry = newPageMap.get(nameKey)!;
              entry.adCount += 1;
              ad.publisher_platforms?.forEach((p: string) => {
                if (!entry.platforms.includes(p)) entry.platforms.push(p);
              });
            } else {
              newPageMap.set(nameKey, {
                page_name: ad.page_name ?? trimmed,
                page_id: ad.page_id,
                adCount: 1,
                platforms: ad.publisher_platforms ?? ["facebook"],
              });
            }
          }

          if (newPageMap.size > 0) {
            const freshPages = Array.from(newPageMap.values());
            discoveredPagesRef.current = [...discoveredPagesRef.current, ...freshPages];
            newPages.push(...freshPages);
            foundNewPages = true;
          }
        }
      } while (isLoadMore && !foundNewPages && apiHasMore && !authErrorOccurred);

      // ── After loop: handle new pages count enhancement ────────────────
      if (newPages.length > 0 && !authErrorOccurred) {
        await Promise.all(
          newPages.map(async (page) => {
            try {
              const countUrl = `https://graph.facebook.com/v18.0/ads_archive?search_terms=${encodeURIComponent(
                page.page_name
              )}&ad_type=ALL&ad_active_status=ALL&ad_reached_countries=[${COUNTRIES
                .split(',')
                .map((c) => `"${c}"`)
                .join(',')}]&fields=publisher_platforms&access_token=${fbAccessToken}&limit=25`;

              const countResponse = await fetch(countUrl);
              if (!countResponse.ok) return;

              const countData = await countResponse.json();
              if (countData.data) {
                page.adCount = countData.data.length;
                const platformsSet = new Set(page.platforms);
                countData.data.forEach((ad: any) => {
                  ad.publisher_platforms?.forEach((p: string) => platformsSet.add(p));
                });
                page.platforms = Array.from(platformsSet);
                page.hasMore = countData.data.length === 25 && !!countData.paging?.next;
              }
            } catch (err) {
              console.error(`Failed to get count for ${page.page_name}`, err);
            }
          })
        );

        setDiscoveredPages([...discoveredPagesRef.current]);
      }

      pageCursorRef.current = nextCursor;
      setPageCursor(nextCursor);
      setHasMorePages(apiHasMore && !authErrorOccurred);
      if (!authErrorOccurred) markApiSuccess();

    } catch (err) {
      console.error("Page search fatal error:", err);
    } finally {
      setSearching(false);
      setLoadingMore(false);

      // ── Final user feedback ───────────────────────────────────────────
      if (authErrorOccurred) {
        toast({
          title: "Account Approval / Verification Required",
          description: "Your Facebook account needs identity verification or Ads Library access approval from Meta. Please complete this step.",
          variant: "destructive",
          duration: 8000,
        });
      }
      // else if (discoveredPages.length === 0 && !newName.trim()) {
      //   // no-op
      // } else if (discoveredPages.length === 0) {
      //   toast({
      //     title: "No pages found",
      //     description: "Try a different brand name or check your search term.",
      //     variant: "default",
      //   });
      // }
    }
  };

  const handleLoadMorePages = () => {
    searchPages(true);
  };

  const selectPage = (page: DiscoveredPage) => {
    addBrand(page.page_name, page.page_id);
    toast({ title: t.brandAdded });
    resetAddForm();
    setTimeout(() => fetchAllAds(), 100);
  };

  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName("");
    setDiscoveredPages([]);
    setPageCursor(null);
    setHasMorePages(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {showApprovalNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-8">
            <button
              onClick={acknowledgeNotice}
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
                <h2 className="text-lg font-semibold text-foreground mb-2">Important – Before Searching Ads</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your Facebook account needs to be <span className="font-medium text-foreground">identity verified</span> by Meta to use the Ad Library API.
                  Without this step, searches may fail even after connecting.
                </p>
                <a
                  href="https://www.facebook.com/help/contact/515009838910929"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1877F2] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Check / Start Identity Verification
                </a>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={acknowledgeNotice}>
                I'll do it later
              </Button>
              <Button
                onClick={acknowledgeNotice}
                className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
              >
                Got it – Continue
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

        {showAddForm && (
          <div className="mb-8 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t.addBrand}</h2>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetAddForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder={t.brandName}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm max-w-xs"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && searchPages()}
              />
              <Button size="sm" onClick={() => searchPages(false)} disabled={!newName.trim() || searching} className="gap-1.5">
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {t.searchPages}
              </Button>
            </div>

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
                          {page.adCount}{page.hasMore ? '+' : ''} {t.adsFound} · {page.platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
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

                {/* ── Load more PAGES button ─────────────────────────── */}
                {hasMorePages && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMorePages}
                      disabled={loadingMore}
                      className="gap-2 min-w-[180px]"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading more pages...
                        </>
                      ) : (
                        "Load more pages"
                      )}
                    </Button>
                  </div>
                )}
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
                    verify your identity
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredAds.map((ad) => (
                <div key={ad.id} className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    {ad.snapshot_url ? (
                      <div className="w-full h-full">
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6 text-center">
                          <Eye className="h-12 w-12 text-muted-foreground/70 mb-4" />
                          <p className="text-base font-medium text-foreground">View Ad Creative</p>
                          <p className="text-sm text-muted-foreground mt-2 max-w-[80%]">
                            Click to see the full ad preview in new tab
                          </p>
                        </div>

                        <a
                          href={ad.snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                        >
                          <div className="rounded-full bg-white/90 p-4 shadow-lg transform hover:scale-110 transition-transform">
                            <ExternalLink className="h-8 w-8 text-primary" />
                          </div>
                        </a>
                      </div>
                    ) : ad.image_url?.startsWith("gradient:") ? (
                      <MockAdImage gradient={ad.image_url.replace("gradient:", "")} name={ad.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <Eye className="h-16 w-16 opacity-40" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                        className="p-1.5 rounded-md bg-card/90 hover:bg-card text-foreground transition-colors shadow-sm"
                        title={isSaved(ad.id) ? t.adUnsave : t.adSave}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved(ad.id) ? "fill-current" : ""}`} />
                      </button>

                      {ad.snapshot_url && (
                        <a
                          href={ad.snapshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md bg-card/90 hover:bg-card text-foreground transition-colors shadow-sm"
                          title="View full ad"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-foreground mb-1 line-clamp-2">{ad.page_name || ad.name}</h3>
                    {ad.snapshot_url && (
                      <a
                        href={ad.snapshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate block mb-2"
                      >
                        Open ad snapshot
                      </a>
                    )}
                    {ad.text && <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{ad.text}</p>}
                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-x-2 justify-between">
                        {ad.platform && <span className="capitalize px-4 py-2 break-words rounded-full bg-muted text-muted-foreground">{ad?.platform}</span>}
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

            {/* ── Load more ADS button ──────────────────────────────── */}
            {hasMoreAds && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  onClick={fetchMoreAds}
                  disabled={loadingMoreAds}
                  className="gap-2 min-w-[200px]"
                >
                  {loadingMoreAds ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading more ads...
                    </>
                  ) : (
                    "Load more ads"
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {!loading && filteredAds.length === 0 && !error && selectedBrandId && initialLoaded && (
          <div className="text-center py-12"><p className="text-muted-foreground">{t.noAdsFound}</p></div>
        )}
      </div>
    </div>
  );
};

export default InspirationAds;