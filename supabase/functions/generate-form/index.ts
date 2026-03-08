import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Helpers ───────────────────────────────────────────────────

type FormVariant = "lagos_non_artisan" | "lagos_artisan" | "abuja_form_a";

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    const m = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${String(d.getDate()).padStart(2, "0")}-${m[d.getMonth()]}-${d.getFullYear()}`;
  } catch { return dateStr; }
}

function upper(v: string | null | undefined): string { return (v || "").toUpperCase(); }

function mapMarital(s: string): string {
  const m: Record<string, string> = { Single:"SINGLE", Married:"MARRIED", Separated:"SEPARATED", Widow:"WIDOW", Widower:"WIDOWER", Divorced:"DIVORCED" };
  return m[s] || s.toUpperCase();
}

function detectVariant(data: any): FormVariant {
  const state = (data.profile?.stateOfResidence || "").toLowerCase();
  if (state === "fct" || state === "abuja" || state === "federal capital territory") return "abuja_form_a";
  if (data.profile?.filingType === "Business") return "lagos_artisan";
  return "lagos_non_artisan";
}

function mapLagos(data: any, variant: "lagos_non_artisan" | "lagos_artisan") {
  const p = data.profile || {};
  return {
    meta: { variant, state: "Lagos", taxYear: data.taxYear, generatedAt: data.generatedAt },
    personalParticulars: {
      field1_fullName: upper(data.fullName),
      field2_title: p.title ? upper(p.title) : null,
      field3_maritalStatus: mapMarital(p.maritalStatus || "Single"),
      field4_dateOfBirth: formatDate(p.dateOfBirth),
      field5_residentialAddress: upper(p.residentialAddress),
      field6_nationality: upper(p.nationality) || "NIGERIAN",
      field7_businessOrEmploymentAddress: upper(p.employerAddress),
      field8_occupation: upper(p.occupation),
      field9_residenceAsAt1stJan: upper(p.stateOfResidence),
    },
    spouseInformation: {
      field10_spouseName: upper(p.spouseName) || null,
      field11_spouseDateOfBirth: formatDate(p.spouseDateOfBirth),
      field12_spouseOccupation: p.spouseOccupation ? upper(p.spouseOccupation) : null,
      field13_spouseBusinessAddress: p.spouseBusinessAddress ? upper(p.spouseBusinessAddress) : null,
    },
    childrenInformation: { field14_numberOfChildren: p.numChildren || 0 },
    incomeAndTaxHistory: { field15_yearData: data.historicalYears || [] },
    declaration: { field16_signatureDate: null, declarantName: upper(data.fullName) },
  };
}

function mapAbuja(data: any) {
  const p = data.profile || {};
  const comp = data.computation || {};
  const bd = comp.breakdownJson || {};
  const incomes = data.incomeRecords || [];
  const bik = data.benefitsInKind || [];
  const deductions = data.deductions || [];

  const sumType = (t: string) => incomes.filter((i: any) => i.type === t).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const bikCat = (c: string) => bik.filter((b: any) => b.category === c).reduce((s: number, b: any) => s + (b.annualValue || 0), 0);
  const dedType = (t: string) => deductions.filter((d: any) => d.type === t).reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const bikTotal = bik.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);
  const nameParts = (data.fullName || "").split(" ");

  return {
    meta: { variant: "abuja_form_a", state: "FCT", taxYear: data.taxYear, generatedAt: data.generatedAt },
    sectionA_personalInfo: {
      tin: p.tin || "", surname: upper(nameParts[nameParts.length - 1]),
      firstName: upper(nameParts[0] || ""), otherNames: upper(nameParts.slice(1, -1).join(" ")),
      dateOfBirth: formatDate(p.dateOfBirth), sex: upper(p.sex),
      maritalStatus: mapMarital(p.maritalStatus || "Single"),
      nationality: upper(p.nationality) || "NIGERIAN", stateOfOrigin: upper(p.stateOfResidence),
      lga: upper(p.lga), residentialAddress: upper(p.residentialAddress), postalAddress: "",
      email: p.email || null, phoneNumber: p.phoneNumber || null,
      occupation: upper(p.occupation), nameOfEmployer: upper(p.employerName),
      employerAddress: upper(p.employerAddress), employerTin: p.employerTin || "",
    },
    sectionB_incomeDetails: {
      employment: {
        salary: sumType("Employment"), transport: 0, housing: 0, otherAllowances: 0,
        directorsFees: 0, commissionsBonus: 0,
        benefitsInKind: { motorVehicle: bikCat("Motor Vehicle"), driverGardener: bikCat("Domestic Staff"), housing: bikCat("Housing"), otherDomestic: bikCat("Other"), total: bikTotal },
        totalEmploymentIncome: sumType("Employment") + bikTotal,
      },
      business: { tradeOrProfession: sumType("Business") + sumType("Freelance"), contractPayments: 0, otherIncome: sumType("Other") + sumType("Crypto"), totalBusinessIncome: sumType("Business") + sumType("Freelance") + sumType("Other") + sumType("Crypto") },
      investment: { rents: sumType("Rental"), interest: 0, dividends: 0, royalties: 0, commissionsInvestment: 0, fees: 0, otherInvestment: sumType("Investment"), totalInvestmentIncome: sumType("Rental") + sumType("Investment") },
      totalIncome: comp.totalIncome || 0,
    },
    sectionC_reliefAndDeductions: {
      consolidatedRelief: (bd.cra || {}).total || 0,
      pensionContribution: { companyName: "", amount: dedType("Pension") },
      nhf: { companyName: "", amount: dedType("NHF") },
      nhis: { companyName: "", amount: dedType("NHIS") },
      lifeAssurance: { companyName: "", amount: dedType("Life Assurance") },
      gratuity: dedType("Gratuity"),
      totalReliefs: (comp.totalIncome || 0) - (comp.taxableIncome || 0),
      taxableIncome: comp.taxableIncome || 0,
    },
    sectionD_taxComputation: {
      brackets: (bd.bands || []).map((b: any) => ({ range: b.range || "", rate: b.rate || "", tax: b.tax || 0 })),
      totalTaxPayable: comp.taxOwed || 0, minimumTax: bd.minimumTax || 0,
      taxCharged: comp.taxOwed || 0,
      taxAlreadyPaid: { whTax: 0, paye: bd.monthlyPAYE ? bd.monthlyPAYE * 12 : 0, selfAssessment: 0, total: 0 },
      balanceDue: comp.taxOwed || 0,
    },
    declaration: { signatureDate: null, declarantName: upper(data.fullName) },
  };
}

// ─── Auth: Validate API key ────────────────────────────────────

function validateApiKey(req: Request): boolean {
  // Accept via Authorization: Bearer <key> or x-api-key header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "") === Deno.env.get("FORMS_API_KEY");
  }
  const apiKey = req.headers.get("x-api-key");
  return apiKey === Deno.env.get("FORMS_API_KEY");
}

// ─── Handler ───────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate: service role key only
  if (!validateApiKey(req)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Valid API key required." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { formId, variant: requestedVariant } = await req.json();
    if (!formId) {
      return new Response(JSON.stringify({ error: "formId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("generated_forms")
      .select("*")
      .eq("id", formId)
      .single();

    if (error || !row) {
      return new Response(JSON.stringify({ error: "Form not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const summaryData = typeof row.summary_json === "string" ? JSON.parse(row.summary_json) : row.summary_json;
    const variant: FormVariant = requestedVariant || detectVariant(summaryData);

    let mappedSchema;
    switch (variant) {
      case "lagos_non_artisan":
      case "lagos_artisan":
        mappedSchema = mapLagos(summaryData, variant);
        break;
      case "abuja_form_a":
        mappedSchema = mapAbuja(summaryData);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown variant: ${variant}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      formId: row.id,
      variant,
      formType: row.form_type,
      status: row.status,
      generatedAt: row.generated_at,
      callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/form-webhook`,
      schema: mappedSchema,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
