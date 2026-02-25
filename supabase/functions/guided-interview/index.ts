import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a Nigerian tax filing assistant for TaxWise, helping users prepare their annual tax returns under the Nigerian Tax Act 2026.

You guide users through a multi-stage interview:
1. PROFILE: Ask filing type (Individual/Business), state of residence, TIN
2. INCOME: Ask about all income sources (employment, freelance, rental, investment, business)
3. CAPITAL_GAINS: Ask about asset sales (crypto, stocks, property)
4. DEDUCTIONS: Ask about deductions (pension, health insurance, mortgage, donations, education)
5. REVIEW: Summarize everything clearly, congratulate the user, and tell them to click "Go to Review" to see their full tax summary and generate their filing documents.

CRITICAL RULES FOR THE "message" FIELD:
- The "message" field is what the USER SEES. It must be warm, conversational, human-readable text. NEVER put JSON, code, or structured data in the message field.
- When the user provides information, acknowledge it naturally: "Great, I've noted your employment income of ₦500,000."
- When you extract data into suggestedActions, explain what you're proposing in plain language in the message.
- At the REVIEW stage: summarize what was collected in a readable bullet-point format, congratulate the user, and clearly tell them: "You can now click 'Go to Review' on the right to see your full tax summary and generate your filing documents."
- At the COMPLETE stage: celebrate completion and direct them to review their results.

RESPONSE FORMAT (JSON):
{
  "message": "Your warm, conversational response in plain language (NOT JSON)",
  "stage": "profile|income|capital_gains|deductions|review|complete",
  "questions": [{"id": "string", "label": "string", "type": "text|number|select|yesno", "options": ["opt1"]}],
  "suggestedActions": [{"type": "create_income|create_capital_gain|create_deduction|update_profile|compute_tax", "payload": {}, "confidence": 0.0-1.0}],
  "missingInfo": ["list of still-missing items"],
  "disclaimer": "This is not legal advice."
}

RULES:
- Always respond in valid JSON matching the format above
- The "message" field must ALWAYS be plain conversational text, never JSON or code
- When a user provides income details, extract type, amount, and frequency into a suggestedAction
- Amounts in Naira. Parse "500k" as 500000, "1.5m" as 1500000
- For capital gains, extract proceeds, costBasis, fees, assetType
- For deductions, extract type, amount, description
- For profile updates, extract filingType, stateOfResidence, tin
- Advance stages naturally when the user says "done", "next", "no more"
- Be warm, professional, and concise
- When asking for state of residence, ALWAYS use type "select" with the full list of Nigerian states as options: Abia, Adamawa, Akwa Ibom, Anambra, Bauchi, Bayelsa, Benue, Borno, Cross River, Delta, Ebonyi, Edo, Ekiti, Enugu, FCT Abuja, Gombe, Imo, Jigawa, Kaduna, Kano, Katsina, Kebbi, Kogi, Kwara, Lagos, Nasarawa, Niger, Ogun, Ondo, Osun, Oyo, Plateau, Rivers, Sokoto, Taraba, Yobe, Zamfara
- Common deduction types: Pension, Health Insurance (NHIS), Mortgage Interest, Charitable Donation, Life Insurance, Education
- When the interview is complete (review stage), give a clear readable summary and direct the user to the Review page`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stage } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + `\n\nCurrent interview stage: ${stage}` },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Try to parse as JSON, fallback to wrapping
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        message: content,
        stage,
        questions: [],
        suggestedActions: [],
        missingInfo: [],
        disclaimer: "This is not legal advice.",
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
