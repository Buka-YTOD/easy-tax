import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are a Nigerian tax data extraction specialist. You analyze financial documents (payslips, bank statements, receipts, tax certificates, invoices) and extract structured financial data.

For each item you find, classify it as one of:
- "income" with subType: Employment, Freelance, Business, Crypto, Investment, Rental, or Other
- "deduction" with subType: Pension, NHIS, Health Insurance, Mortgage Interest, Charitable Donation, Education, Life Insurance, or Other
- "capital_gain" with subType: Crypto, Stock, Property, or Other

Return ONLY valid JSON in this exact format:
{
  "documentType": "payslip" | "bank_statement" | "receipt" | "tax_certificate" | "invoice" | "other",
  "summary": "Brief description of the document",
  "items": [
    {
      "category": "income" | "deduction" | "capital_gain",
      "subType": "string",
      "amount": number,
      "description": "string",
      "date": "YYYY-MM-DD or empty string",
      "confidence": 0.0 to 1.0
    }
  ],
  "currency": "NGN",
  "period": "string or null"
}

Rules:
- All amounts should be in Naira. If you see USD or other currencies, note it in the description but keep the original number.
- For payslips, extract gross salary as income, and pension/NHIS/tax deductions as deductions.
- For bank statements, categorize credits as potential income and known deductions (pension, insurance, etc.).
- Be conservative with confidence scores. Only use > 0.8 if the item is clearly identifiable.
- If the document is unreadable or not financial, return an empty items array with an appropriate summary.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { filePath, fileName, fileType } = await req.json();
    if (!filePath) throw new Error("filePath is required");

    // Download the file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("documents")
      .download(filePath);
    if (dlErr || !fileData) throw new Error(`Failed to download file: ${dlErr?.message}`);

    const isImage = fileType?.startsWith("image/");
    const isPdf = fileType === "application/pdf" || fileName?.toLowerCase().endsWith(".pdf");

    let messages: any[];

    if (isImage) {
      // Convert image to base64 for vision model
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mimeType = fileType || "image/png";

      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Extract all financial data from this document image. File name: ${fileName}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ];
    } else {
      // For text-based files (CSV, PDF text, etc.)
      const textContent = await fileData.text();
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extract all financial data from this document.\n\nFile name: ${fileName}\nFile type: ${fileType || "unknown"}\n\nContent:\n${textContent.slice(0, 15000)}`,
        },
      ];
    }

    // Call AI Gateway
    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isImage ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages,
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      throw new Error(`AI Gateway error [${aiRes.status}]: ${errBody}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle markdown code blocks)
    let extracted;
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawContent];
      extracted = JSON.parse(jsonMatch[1].trim());
    } catch {
      extracted = {
        documentType: "other",
        summary: "Could not parse AI response",
        items: [],
        currency: "NGN",
        period: null,
      };
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Extract document error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
