import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RequestBody {
  search_query: string;
  limit?: number;
}

interface MetaAdResponse {
  ads: Array<{
    id: string;
    name: string;
    image_url?: string;
    text?: string;
    platform?: string;
    created_at?: string;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

    if (!META_APP_ID) {
      throw new Error("META_APP_ID is not configured");
    }

    if (!META_APP_SECRET) {
      throw new Error("META_APP_SECRET is not configured");
    }

    const body: RequestBody = await req.json();
    const { search_query, limit = 20 } = body;

    if (!search_query) {
      throw new Error("search_query is required");
    }

    // For now, return mock data since the Ad Library API requires proper OAuth setup
    // In production, you would use the real Meta Ad Library API endpoint
    const mockAds = [
      {
        id: "1",
        name: "Creative Design Campaign",
        image_url:
          "https://via.placeholder.com/300x300?text=Creative+Design",
        text: "Discover our stunning design portfolio and get inspired for your next project.",
        platform: "instagram",
        created_at: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "2",
        name: "Digital Marketing Solutions",
        image_url:
          "https://via.placeholder.com/300x300?text=Marketing+Solutions",
        text: "Transform your business with our cutting-edge digital marketing strategies.",
        platform: "facebook",
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "3",
        name: "Modern Tech Innovation",
        image_url:
          "https://via.placeholder.com/300x300?text=Tech+Innovation",
        text: "Stay ahead with the latest technology trends and innovations.",
        platform: "instagram",
        created_at: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "4",
        name: "Brand Excellence Awards",
        image_url: "https://via.placeholder.com/300x300?text=Brand+Excellence",
        text: "Award-winning campaigns that deliver exceptional results.",
        platform: "facebook",
        created_at: new Date().toISOString(),
      },
      {
        id: "5",
        name: "Social Media Mastery",
        image_url:
          "https://via.placeholder.com/300x300?text=Social+Media+Mastery",
        text: "Master social media marketing with proven strategies and tactics.",
        platform: "instagram",
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "6",
        name: "E-commerce Revolution",
        image_url: "https://via.placeholder.com/300x300?text=E-commerce",
        text: "Boost your online sales with our e-commerce solutions.",
        platform: "facebook",
        created_at: new Date(
          Date.now() - 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    // Filter based on search query
    const filtered = mockAds.filter(
      (ad) =>
        ad.name.toLowerCase().includes(search_query.toLowerCase()) ||
        ad.text?.toLowerCase().includes(search_query.toLowerCase())
    );

    const response: MetaAdResponse = {
      ads: filtered.slice(0, Math.min(limit, filtered.length)),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error in meta-ad-library function:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
