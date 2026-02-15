import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { source_url, ad_id } = await req.json();
    if (!source_url || !ad_id) throw new Error("source_url and ad_id required");

    // Download the media
    const response = await fetch(source_url);
    if (!response.ok) throw new Error(`Failed to fetch media: ${response.status}`);

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Determine extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("mp4") || contentType.includes("video")) ext = "mp4";
    else if (contentType.includes("mov")) ext = "mov";

    const filePath = `${user.id}/${ad_id}.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("saved-ad-media")
      .upload(filePath, uint8, {
        contentType,
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("saved-ad-media")
      .getPublicUrl(filePath);

    // Update saved_ads record
    await supabase
      .from("saved_ads")
      .update({ stored_media_url: urlData.publicUrl })
      .eq("user_id", user.id)
      .eq("ad_id", ad_id);

    return new Response(JSON.stringify({ stored_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
