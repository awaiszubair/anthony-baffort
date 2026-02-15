import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPLICATE_API = "https://api.replicate.com/v1";
const KLING_MODEL_VERSION = "kwaivgi/kling-v2.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) throw new Error("REPLICATE_API_TOKEN not configured");

    const { action, taskId, imageBase64, prompt, duration, mode } = await req.json();

    if (action === "create") {
      if (!imageBase64) throw new Error("imageBase64 is required");

      // Build data URI for Replicate
      const dataUri = imageBase64.startsWith("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;

      const input: Record<string, unknown> = {
        image: dataUri,
        duration: Number(duration) || 5,
        cfg_scale: 0.5,
      };
      if (prompt) input.prompt = prompt;
      if (mode === "pro") input.mode = "pro";

      const resp = await fetch(`${REPLICATE_API}/models/${KLING_MODEL_VERSION}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "",
        },
        body: JSON.stringify({ input }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(`Replicate API error [${resp.status}]: ${JSON.stringify(data)}`);
      }

      // Map to same shape the frontend expects
      return new Response(
        JSON.stringify({
          data: { task_id: data.id, task_status: "processing" },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "poll") {
      if (!taskId) throw new Error("taskId is required");

      const resp = await fetch(`${REPLICATE_API}/predictions/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(`Replicate poll error [${resp.status}]: ${JSON.stringify(data)}`);
      }

      // Map Replicate statuses to what the frontend expects
      let taskStatus: string;
      if (data.status === "succeeded") {
        taskStatus = "succeed";
      } else if (data.status === "failed" || data.status === "canceled") {
        taskStatus = "failed";
      } else {
        taskStatus = "processing";
      }

      const videoUrl = data.output;

      return new Response(
        JSON.stringify({
          data: {
            task_status: taskStatus,
            task_status_msg: data.error || "",
            task_result: {
              videos: videoUrl ? [{ url: typeof videoUrl === "string" ? videoUrl : videoUrl[0] || videoUrl }] : [],
            },
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
