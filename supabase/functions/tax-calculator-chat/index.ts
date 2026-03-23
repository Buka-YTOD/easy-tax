import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a Nigerian tax calculator assistant for Tax Ease. You help users calculate their taxes through conversation.

YOUR ROLE:
- Parse bank statements, CSV data, or manually entered financial information
- Categorize transactions into income, deductions, and capital gains
- Compute taxes using the Nigerian Tax Act 2026 progressive brackets
- Explain the computation step by step

NIGERIAN TAX ACT 2026 — PROGRESSIVE BRACKETS:
• ₦0 – ₦800,000: 0% (Tax-free threshold)
• ₦800,001 – ₦3,200,000: 15%
• ₦3,200,001 – ₦12,000,000: 18%
• ₦12,000,001 – ₦25,000,000: 21%
• Above ₦25,000,000: 25%

CONSOLIDATED RELIEF ALLOWANCE (CRA):
CRA = Higher of (1% of Gross Income OR ₦200,000) + 20% of Gross Income
Taxable Income = Gross Income − Statutory Deductions − CRA
Monthly PAYE = Annual Tax / 12

COMMON DEDUCTION TYPES:
- Pension contributions (up to 8% of basic salary)
- National Health Insurance Scheme (NHIS)
- Life Assurance premiums
- Mortgage interest
- Charitable donations (to approved institutions)

WHEN USER PASTES CSV/BANK DATA:
1. Parse each row: Date, Description, Category, Amount
2. Classify positive amounts as Income, negative as Expenses/Deductions
3. Sub-categorize: Employment, Business, Freelance, Investment, Rental for income; Rent, Utilities, Supplies, Professional Fees, etc. for deductions
4. Present a clear summary table of categorized items
5. Calculate: Gross Income, Applicable Deductions, CRA, Taxable Income, Tax Owed per bracket, Total Tax, Monthly PAYE

RESPONSE FORMAT (JSON):
{
  "message": "Your conversational response with calculations and explanations in markdown format",
  "hasComputation": false,
  "computation": null | {
    "grossIncome": number,
    "totalDeductions": number,
    "cra": number,
    "taxableIncome": number,
    "taxOwed": number,
    "monthlyPAYE": number,
    "brackets": [{"bracket": "string", "rate": number, "taxableAmount": number, "tax": number}],
    "incomeBreakdown": [{"category": "string", "amount": number}],
    "deductionBreakdown": [{"category": "string", "amount": number}]
  }
}

RULES:
- Always respond in valid JSON matching the format above
- The "message" field should be rich markdown: use tables, bold, bullet points
- When you have enough data to compute, set hasComputation=true and fill the computation object
- Parse amounts: remove commas, handle negative numbers, "500k" = 500000, "1.5m" = 1500000
- All amounts in Naira (₦)
- Be warm, professional, and thorough in explanations
- When showing a summary, use a markdown table
- If the user asks about concepts, explain clearly without computing
- If data is ambiguous, ask clarifying questions
- Do NOT include any Withholding Tax (WHT) glossary or WHT-specific sections
- Skip WHT explanations unless the user specifically asks about withholding tax`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
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
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      let cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        message: content,
        hasComputation: false,
        computation: null,
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
