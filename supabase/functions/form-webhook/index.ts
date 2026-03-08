import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

/**
 * Webhook endpoint for the external forms API to notify us when PDF generation is complete.
 *
 * Authentication: HMAC-SHA256 signature in x-webhook-signature header.
 * The forms API signs the raw JSON body using the shared FORMS_WEBHOOK_SECRET.
 *
 * Expected payload:
 * {
 *   "formId": "uuid",
 *   "status": "completed" | "failed",
 *   "pdfUrl": "https://...",
 *   "errorMessage": null | "string",
 *   "completedAt": "ISO8601"
 * }
 */

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison
  if (expectedHex.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    result |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("FORMS_WEBHOOK_SECRET");
  if (!secret) {
    console.error("FORMS_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature") || "";

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const valid = await verifySignature(rawBody, signature, secret);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = JSON.parse(rawBody);
    const { formId, status, pdfUrl, errorMessage, completedAt } = payload;

    if (!formId || !status) {
      return new Response(JSON.stringify({ error: "formId and status are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["completed", "failed"].includes(status)) {
      return new Response(JSON.stringify({ error: "status must be 'completed' or 'failed'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Update the generated_forms record
    const updateData: Record<string, any> = {
      webhook_status: status,
      webhook_received_at: completedAt || new Date().toISOString(),
    };

    if (status === "completed" && pdfUrl) {
      updateData.pdf_url = pdfUrl;
      updateData.status = "ready";
    } else if (status === "failed") {
      updateData.status = "draft"; // Reset to draft on failure
    }

    const { data: row, error } = await supabase
      .from("generated_forms")
      .update(updateData)
      .eq("id", formId)
      .select("id, status, pdf_url, webhook_status")
      .single();

    if (error) {
      console.error("DB update error:", error);
      return new Response(JSON.stringify({ error: "Failed to update form record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!row) {
      return new Response(JSON.stringify({ error: "Form not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Webhook received for form ${formId}: status=${status}, pdfUrl=${pdfUrl || "none"}`);

    return new Response(JSON.stringify({
      success: true,
      formId: row.id,
      status: row.status,
      webhookStatus: row.webhook_status,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
