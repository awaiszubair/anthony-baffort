import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64url } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KLING_API_BASE = "https://api.klingai.com";

async function generateJWT(): Promise<string> {
  const ak = Deno.env.get("KLING_ACCESS_KEY");
  const sk = Deno.env.get("KLING_SECRET_KEY");
  if (!ak || !sk) throw new Error("KLING_ACCESS_KEY or KLING_SECRET_KEY not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: ak,
    exp: now + 1800,
    nbf: now - 5,
    iat: now,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sk),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const sigB64 = base64url(new Uint8Array(sig));

  return `${data}.${sigB64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, taskId, imageBase64, prompt, duration, mode } = await req.json();
    const token = await generateJWT();

    if (action === "create") {
      // Create image-to-video task
      if (!imageBase64) throw new Error("imageBase64 is required");

      const body: Record<string, unknown> = {
        model_name: "kling-v1",
        image: imageBase64,
        duration: duration || "5",
        mode: mode || "std",
      };
      if (prompt) body.prompt = prompt;

      const resp = await fetch(`${KLING_API_BASE}/v1/videos/image2video`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(`Kling API error [${resp.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "poll") {
      if (!taskId) throw new Error("taskId is required");

      const resp = await fetch(`${KLING_API_BASE}/v1/videos/image2video/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(`Kling poll error [${resp.status}]: ${JSON.stringify(data)}`);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error: unknown) {
    console.error("Kling video error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
