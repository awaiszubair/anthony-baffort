import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API_VERSION = "v22.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface RequestBody {
  search_query: string;
  page_id?: string;
  limit?: number;
  country?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("META_USER_ACCESS_TOKEN");
    if (!accessToken) throw new Error("META_USER_ACCESS_TOKEN is not configured");

    const body: RequestBody = await req.json();
    const { search_query, page_id, limit = 20, country = "ALL" } = body;

    if (!search_query && !page_id) {
      throw new Error("search_query or page_id is required");
    }

    // Build query params
    const params = new URLSearchParams();
    params.set("access_token", accessToken);
    params.set("ad_reached_countries", `["${country}"]`);
    params.set("ad_type", "ALL");
    params.set("ad_active_status", "ALL");
    params.set("limit", String(limit));
    params.set("fields", [
      "id",
      "ad_creative_bodies",
      "ad_creative_link_captions",
      "ad_creative_link_titles",
      "ad_delivery_start_time",
      "ad_delivery_stop_time",
      "ad_snapshot_url",
      "page_id",
      "page_name",
      "publisher_platforms",
      "languages",
    ].join(","));

    // Use search_terms for keyword search, or search_page_ids for specific page
    if (page_id) {
      params.set("search_page_ids", page_id);
      // search_terms is required even with search_page_ids — use empty string
      params.set("search_terms", "");
    } else {
      params.set("search_terms", search_query);
    }

    const url = `${GRAPH_API_BASE}/ads_archive?${params.toString()}`;
    console.log("Fetching Meta Ad Library:", url.replace(accessToken, "***"));

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      const errMsg = data.error?.message || `Meta API error [${response.status}]`;
      console.error("Meta API error:", JSON.stringify(data.error));
      throw new Error(errMsg);
    }

    // Transform the response into a cleaner format
    const ads = (data.data || []).map((ad: Record<string, unknown>) => ({
      id: ad.id,
      name: (ad as { ad_creative_link_titles?: string[] }).ad_creative_link_titles?.[0] ||
            (ad as { page_name?: string }).page_name || "Untitled",
      text: (ad as { ad_creative_bodies?: string[] }).ad_creative_bodies?.[0] || "",
      snapshot_url: ad.ad_snapshot_url || "",
      page_name: ad.page_name || "",
      page_id: ad.page_id || "",
      platform: Array.isArray(ad.publisher_platforms)
        ? (ad.publisher_platforms as string[]).join(", ")
        : "",
      created_at: ad.ad_delivery_start_time || "",
      stopped_at: ad.ad_delivery_stop_time || null,
    }));

    return new Response(
      JSON.stringify({ ads, paging: data.paging || null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in meta-ad-library function:", error);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, ads: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
