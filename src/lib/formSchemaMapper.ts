/**
 * Variant-aware form schema mapper.
 * Supports: lagos_non_artisan, lagos_artisan, abuja_form_a
 * Each variant maps internal summary data to the exact fields on the official form.
 */

export type FormVariant = 'lagos_non_artisan' | 'lagos_artisan' | 'abuja_form_a';

// ─── Shared helpers ────────────────────────────────────────────

export interface SchemaMissingFields {
  field: string;
  formNumber: number | string;
  description: string;
}

function formatDateForForm(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function upper(val: string | null | undefined): string {
  return (val || '').toUpperCase();
}

function mapMaritalStatus(status: string): string {
  const mapping: Record<string, string> = {
    Single: 'SINGLE', Married: 'MARRIED', Separated: 'SEPARATED',
    Widow: 'WIDOW', Widower: 'WIDOWER', Divorced: 'DIVORCED',
  };
  return mapping[status] || status.toUpperCase();
}

// ─── Lagos Abridged Form A (Non-Artisan & Artisan) ─────────────
// Both Lagos forms share the same 20-field structure.
// The only difference is the form_type label.

export interface LagosFormASchema {
  meta: {
    variant: 'lagos_non_artisan' | 'lagos_artisan';
    state: 'Lagos';
    taxYear: number;
    generatedAt: string;
  };
  personalParticulars: {
    field1_fullName: string;
    field2_title: string | null;
    field3_maritalStatus: string;
    field4_dateOfBirth: string | null;
    field5_residentialAddress: string;
    field6_nationality: string;
    field7_businessOrEmploymentAddress: string;
    field8_occupation: string;
    field9_residenceAsAt1stJan: string;
  };
  spouseInformation: {
    field10_spouseName: string | null;
    field11_spouseDateOfBirth: string | null;
    field12_spouseOccupation: string | null;
    field13_spouseBusinessAddress: string | null;
  };
  childrenInformation: {
    field14_numberOfChildren: number;
  };
  incomeAndTaxHistory: {
    field15_yearData: Array<{ year: number; income: number; taxPaid: number }>;
  };
  declaration: {
    field16_signatureDate: string | null;
    declarantName: string;
  };
  // Fields 17–20 are for official use only
}

function mapLagosFormA(summaryData: any, variant: 'lagos_non_artisan' | 'lagos_artisan'): {
  schema: LagosFormASchema;
  missingFields: SchemaMissingFields[];
} {
  const profile = summaryData.profile || {};
  const missingFields: SchemaMissingFields[] = [];

  if (!profile.title) missingFields.push({ field: 'title', formNumber: 2, description: 'Title (MR, MRS, MISS, DR, CHIEF, ALHAJI, REV)' });
  if (!profile.nationality) missingFields.push({ field: 'nationality', formNumber: 6, description: 'Nationality (e.g., NIGERIAN)' });
  if (profile.maritalStatus === 'Married') {
    if (!profile.spouseDateOfBirth) missingFields.push({ field: 'spouseDateOfBirth', formNumber: 11, description: "Spouse's Date of Birth" });
    if (!profile.spouseOccupation) missingFields.push({ field: 'spouseOccupation', formNumber: 12, description: "Spouse's Occupation" });
    if (!profile.spouseBusinessAddress) missingFields.push({ field: 'spouseBusinessAddress', formNumber: 13, description: "Spouse's Business Address" });
  }

  const schema: LagosFormASchema = {
    meta: { variant, state: 'Lagos', taxYear: summaryData.taxYear, generatedAt: summaryData.generatedAt },
    personalParticulars: {
      field1_fullName: upper(summaryData.fullName),
      field2_title: profile.title ? upper(profile.title) : null,
      field3_maritalStatus: mapMaritalStatus(profile.maritalStatus || 'Single'),
      field4_dateOfBirth: formatDateForForm(profile.dateOfBirth),
      field5_residentialAddress: upper(profile.residentialAddress),
      field6_nationality: upper(profile.nationality) || 'NIGERIAN',
      field7_businessOrEmploymentAddress: upper(profile.employerAddress),
      field8_occupation: upper(profile.occupation),
      field9_residenceAsAt1stJan: upper(profile.stateOfResidence),
    },
    spouseInformation: {
      field10_spouseName: upper(profile.spouseName) || null,
      field11_spouseDateOfBirth: formatDateForForm(profile.spouseDateOfBirth),
      field12_spouseOccupation: profile.spouseOccupation ? upper(profile.spouseOccupation) : null,
      field13_spouseBusinessAddress: profile.spouseBusinessAddress ? upper(profile.spouseBusinessAddress) : null,
    },
    childrenInformation: { field14_numberOfChildren: profile.numChildren || 0 },
    incomeAndTaxHistory: {
      field15_yearData: summaryData.historicalYears || [],
    },
    declaration: {
      field16_signatureDate: null,
      declarantName: upper(summaryData.fullName),
    },
  };

  return { schema, missingFields };
}

// ─── Abuja FCT-IRS Form A (Comprehensive) ──────────────────────

export interface AbujaFormASchema {
  meta: {
    variant: 'abuja_form_a';
    state: 'FCT';
    taxYear: number;
    generatedAt: string;
  };
  sectionA_personalInfo: {
    tin: string;
    surname: string;
    firstName: string;
    otherNames: string;
    dateOfBirth: string | null;
    sex: string;
    maritalStatus: string;
    nationality: string;
    stateOfOrigin: string;
    lga: string;
    residentialAddress: string;
    postalAddress: string;
    email: string | null;
    phoneNumber: string | null;
    occupation: string;
    nameOfEmployer: string;
    employerAddress: string;
    employerTin: string;
  };
  sectionB_incomeDetails: {
    employment: {
      salary: number;
      transport: number;
      housing: number;
      otherAllowances: number;
      directorsFees: number;
      commissionsBonus: number;
      benefitsInKind: {
        motorVehicle: number;
        driverGardener: number;
        housing: number;
        otherDomestic: number;
        total: number;
      };
      totalEmploymentIncome: number;
    };
    business: {
      tradeOrProfession: number;
      contractPayments: number;
      otherIncome: number;
      totalBusinessIncome: number;
    };
    investment: {
      rents: number;
      interest: number;
      dividends: number;
      royalties: number;
      commissionsInvestment: number;
      fees: number;
      otherInvestment: number;
      totalInvestmentIncome: number;
    };
    totalIncome: number;
  };
  sectionC_reliefAndDeductions: {
    consolidatedRelief: number;
    pensionContribution: { companyName: string; amount: number };
    nhf: { companyName: string; amount: number };
    nhis: { companyName: string; amount: number };
    lifeAssurance: { companyName: string; amount: number };
    gratuity: number;
    totalReliefs: number;
    taxableIncome: number;
  };
  sectionD_taxComputation: {
    brackets: Array<{ range: string; rate: string; tax: number }>;
    totalTaxPayable: number;
    minimumTax: number;
    taxCharged: number;
    taxAlreadyPaid: { whTax: number; paye: number; selfAssessment: number; total: number };
    balanceDue: number;
  };
  declaration: {
    signatureDate: string | null;
    declarantName: string;
  };
}

function mapAbujaFormA(summaryData: any): {
  schema: AbujaFormASchema;
  missingFields: SchemaMissingFields[];
} {
  const profile = summaryData.profile || {};
  const computation = summaryData.computation || {};
  const breakdown = computation.breakdownJson || {};
  const incomes = summaryData.incomeRecords || [];
  const deductions = summaryData.deductions || [];
  const bik = summaryData.benefitsInKind || [];
  const missingFields: SchemaMissingFields[] = [];

  // Check missing fields specific to Abuja
  if (!profile.nationality) missingFields.push({ field: 'nationality', formNumber: 'A', description: 'Nationality' });
  if (!profile.email) missingFields.push({ field: 'email', formNumber: 'A', description: 'Email Address' });
  if (!profile.phoneNumber) missingFields.push({ field: 'phoneNumber', formNumber: 'A', description: 'Phone Number' });

  // Split full name into parts
  const nameParts = (summaryData.fullName || '').split(' ');
  const surname = upper(nameParts[nameParts.length - 1]);
  const firstName = upper(nameParts[0] || '');
  const otherNames = upper(nameParts.slice(1, -1).join(' '));

  // Categorize incomes
  const sumByType = (type: string) => incomes.filter((i: any) => i.type === type).reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const employmentIncome = sumByType('Employment');
  const businessIncome = sumByType('Business') + sumByType('Freelance');
  const rentalIncome = sumByType('Rental');
  const investmentIncome = sumByType('Investment');
  const otherIncome = sumByType('Other') + sumByType('Crypto');

  // Categorize BIK
  const bikByCategory = (cat: string) => bik.filter((b: any) => b.category === cat).reduce((s: number, b: any) => s + (b.annualValue || 0), 0);
  const bikTotal = bik.reduce((s: number, b: any) => s + (b.annualValue || 0), 0);

  // Categorize deductions
  const deductionByType = (type: string) => deductions.filter((d: any) => d.type === type).reduce((s: number, d: any) => s + (d.amount || 0), 0);

  const totalIncome = computation.totalIncome || 0;
  const taxableIncome = computation.taxableIncome || 0;
  const taxOwed = computation.taxOwed || 0;
  const cra = breakdown.cra || {};

  const schema: AbujaFormASchema = {
    meta: { variant: 'abuja_form_a', state: 'FCT', taxYear: summaryData.taxYear, generatedAt: summaryData.generatedAt },
    sectionA_personalInfo: {
      tin: profile.tin || '',
      surname,
      firstName,
      otherNames,
      dateOfBirth: formatDateForForm(profile.dateOfBirth),
      sex: upper(profile.sex),
      maritalStatus: mapMaritalStatus(profile.maritalStatus || 'Single'),
      nationality: upper(profile.nationality) || 'NIGERIAN',
      stateOfOrigin: upper(profile.stateOfResidence),
      lga: upper(profile.lga),
      residentialAddress: upper(profile.residentialAddress),
      postalAddress: '',
      email: profile.email || null,
      phoneNumber: profile.phoneNumber || null,
      occupation: upper(profile.occupation),
      nameOfEmployer: upper(profile.employerName),
      employerAddress: upper(profile.employerAddress),
      employerTin: profile.employerTin || '',
    },
    sectionB_incomeDetails: {
      employment: {
        salary: employmentIncome,
        transport: 0, housing: 0, otherAllowances: 0,
        directorsFees: 0, commissionsBonus: 0,
        benefitsInKind: {
          motorVehicle: bikByCategory('Motor Vehicle'),
          driverGardener: bikByCategory('Domestic Staff'),
          housing: bikByCategory('Housing'),
          otherDomestic: bikByCategory('Other'),
          total: bikTotal,
        },
        totalEmploymentIncome: employmentIncome + bikTotal,
      },
      business: {
        tradeOrProfession: businessIncome,
        contractPayments: 0,
        otherIncome,
        totalBusinessIncome: businessIncome + otherIncome,
      },
      investment: {
        rents: rentalIncome,
        interest: 0, dividends: 0, royalties: 0,
        commissionsInvestment: 0, fees: 0,
        otherInvestment: investmentIncome,
        totalInvestmentIncome: rentalIncome + investmentIncome,
      },
      totalIncome,
    },
    sectionC_reliefAndDeductions: {
      consolidatedRelief: cra.total || 0,
      pensionContribution: { companyName: '', amount: deductionByType('Pension') },
      nhf: { companyName: '', amount: deductionByType('NHF') },
      nhis: { companyName: '', amount: deductionByType('NHIS') },
      lifeAssurance: { companyName: '', amount: deductionByType('Life Assurance') },
      gratuity: deductionByType('Gratuity'),
      totalReliefs: totalIncome - taxableIncome,
      taxableIncome,
    },
    sectionD_taxComputation: {
      brackets: (breakdown.bands || []).map((b: any) => ({
        range: b.range || '',
        rate: b.rate || '',
        tax: b.tax || 0,
      })),
      totalTaxPayable: taxOwed,
      minimumTax: breakdown.minimumTax || 0,
      taxCharged: taxOwed,
      taxAlreadyPaid: { whTax: 0, paye: breakdown.monthlyPAYE ? breakdown.monthlyPAYE * 12 : 0, selfAssessment: 0, total: 0 },
      balanceDue: taxOwed,
    },
    declaration: {
      signatureDate: null,
      declarantName: upper(summaryData.fullName),
    },
  };

  return { schema, missingFields };
}

// ─── Unified entry point ───────────────────────────────────────

export type FormSchemaResult =
  | { variant: 'lagos_non_artisan' | 'lagos_artisan'; schema: LagosFormASchema; missingFields: SchemaMissingFields[] }
  | { variant: 'abuja_form_a'; schema: AbujaFormASchema; missingFields: SchemaMissingFields[] };

/**
 * Detects the correct variant from summary data and maps accordingly.
 */
export function detectVariant(summaryData: any): FormVariant {
  const state = (summaryData.profile?.stateOfResidence || '').toLowerCase();
  const filingType = summaryData.profile?.filingType;

  if (state === 'fct' || state === 'abuja' || state === 'federal capital territory') {
    return 'abuja_form_a';
  }
  // Default to Lagos variants
  if (filingType === 'Business') {
    return 'lagos_artisan'; // artisan / self-employed
  }
  return 'lagos_non_artisan';
}

/**
 * Maps summary data to the correct form variant schema.
 */
export function mapToFormSchema(summaryData: any, variant?: FormVariant): FormSchemaResult {
  const v = variant || detectVariant(summaryData);

  switch (v) {
    case 'lagos_non_artisan':
    case 'lagos_artisan': {
      const result = mapLagosFormA(summaryData, v);
      return { variant: v, ...result };
    }
    case 'abuja_form_a': {
      const result = mapAbujaFormA(summaryData);
      return { variant: 'abuja_form_a', ...result };
    }
    default:
      throw new Error(`Unknown form variant: ${v}`);
  }
}

// ─── Legacy compat ─────────────────────────────────────────────

/** @deprecated Use mapToFormSchema instead */
export function mapToLIRSFormASchema(summaryData: any) {
  const result = mapToFormSchema(summaryData, 'lagos_non_artisan');
  // Return in old format for backward compat
  return {
    schema: result.schema as any,
    missingFields: result.missingFields,
  };
}

export function formatSchemaForDisplay(schema: any): string {
  return JSON.stringify(schema, null, 2);
}

// Re-export for backward compat
export type LIRSFormARequest = LagosFormASchema;
