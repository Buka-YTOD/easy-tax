/**
 * Transforms internal summary data into the LIRS Form A API request schema.
 * This schema maps directly to the official LIRS form fields (numbered 1-20).
 */

export interface LIRSFormARequest {
  meta: {
    state: string;
    formType: 'form_a_non_artisan' | 'form_a_artisan' | 'form_h';
    taxYear: number;
    generatedAt: string;
  };
  personalParticulars: {
    field1_fullName: string;
    field2_title: string | null; // MR, MRS, MISS, DR, CHIEF, ALHAJI, REV
    field3_maritalStatus: string; // SINGLE, MARRIED, SEPARATED, WIDOW, WIDOWER, DIVORCED
    field4_dateOfBirth: string | null; // DD-MMM-YYYY format
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
  incomeAndTaxPreviousYears: {
    field15_yearData: Array<{
      year: number;
      income: number;
      taxPaid: number;
    }>;
  };
  declaration: {
    field16_signatureDate: string | null;
    declarantName: string;
  };
  // Fields 17-20 are for official use only (tax station, BIR signatory)

  // Extended data for computation (used for validation/display)
  computedData: {
    totalIncome: number;
    taxableIncome: number;
    taxOwed: number;
    monthlyPAYE: number;
    incomeBreakdown: Array<{
      type: string;
      amount: number;
      frequency: string;
      description: string | null;
    }>;
    deductions: Array<{
      type: string;
      amount: number;
      description: string | null;
    }>;
    cra: {
      statutory: number;
      twentyPercent: number;
      total: number;
    } | null;
  };

  // Supporting documents data
  supportingData: {
    benefitsInKind: Array<{
      category: string;
      description: string | null;
      annualValue: number;
    }>;
    assetDeclarations: Array<{
      assetType: string;
      description: string | null;
      location: string;
      dateAcquired: string | null;
      cost: number;
      currentValue: number;
    }>;
    capitalGains: Array<{
      assetType: string;
      proceeds: number;
      costBasis: number;
      fees: number;
      gain: number;
    }>;
    capitalAllowances: Array<{
      assetDescription: string;
      cost: number;
      ratePercent: number;
      allowanceAmount: number;
      yearAcquired: number | null;
    }>;
  };
}

export interface SchemaMissingFields {
  field: string;
  formNumber: number;
  description: string;
}

/**
 * Maps our internal summary data to the LIRS Form A API request format.
 * Also returns a list of missing fields that should be collected.
 */
export function mapToLIRSFormASchema(summaryData: any): {
  schema: LIRSFormARequest;
  missingFields: SchemaMissingFields[];
} {
  const profile = summaryData.profile || {};
  const computation = summaryData.computation || {};
  const breakdown = computation.breakdownJson || {};

  const missingFields: SchemaMissingFields[] = [];

  // Check for missing required fields
  if (!profile.title) {
    missingFields.push({
      field: 'title',
      formNumber: 2,
      description: 'Title (MR, MRS, MISS, DR, CHIEF, ALHAJI, REV)',
    });
  }
  if (!profile.nationality) {
    missingFields.push({
      field: 'nationality',
      formNumber: 6,
      description: 'Nationality (e.g., NIGERIAN)',
    });
  }
  if (!profile.spouseDateOfBirth && profile.maritalStatus === 'Married') {
    missingFields.push({
      field: 'spouseDateOfBirth',
      formNumber: 11,
      description: "Spouse's Date of Birth",
    });
  }
  if (!profile.spouseOccupation && profile.maritalStatus === 'Married') {
    missingFields.push({
      field: 'spouseOccupation',
      formNumber: 12,
      description: "Spouse's Occupation",
    });
  }
  if (!profile.spouseBusinessAddress && profile.maritalStatus === 'Married') {
    missingFields.push({
      field: 'spouseBusinessAddress',
      formNumber: 13,
      description: "Spouse's Business or Employment Address",
    });
  }

  // Format date to DD-MMM-YYYY
  const formatDateForForm = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Map marital status to form format
  const mapMaritalStatus = (status: string): string => {
    const mapping: Record<string, string> = {
      'Single': 'SINGLE',
      'Married': 'MARRIED',
      'Separated': 'SEPARATED',
      'Widow': 'WIDOW',
      'Widower': 'WIDOWER',
      'Divorced': 'DIVORCED',
    };
    return mapping[status] || status.toUpperCase();
  };

  const schema: LIRSFormARequest = {
    meta: {
      state: profile.stateOfResidence || 'Lagos',
      formType: 'form_a_non_artisan',
      taxYear: summaryData.taxYear,
      generatedAt: summaryData.generatedAt,
    },
    personalParticulars: {
      field1_fullName: summaryData.fullName?.toUpperCase() || '',
      field2_title: profile.title?.toUpperCase() || null,
      field3_maritalStatus: mapMaritalStatus(profile.maritalStatus || 'Single'),
      field4_dateOfBirth: formatDateForForm(profile.dateOfBirth),
      field5_residentialAddress: profile.residentialAddress?.toUpperCase() || '',
      field6_nationality: profile.nationality?.toUpperCase() || 'NIGERIAN',
      field7_businessOrEmploymentAddress: profile.employerAddress?.toUpperCase() || '',
      field8_occupation: profile.occupation?.toUpperCase() || '',
      field9_residenceAsAt1stJan: profile.stateOfResidence?.toUpperCase() || '',
    },
    spouseInformation: {
      field10_spouseName: profile.spouseName?.toUpperCase() || null,
      field11_spouseDateOfBirth: formatDateForForm(profile.spouseDateOfBirth) || null,
      field12_spouseOccupation: profile.spouseOccupation?.toUpperCase() || null,
      field13_spouseBusinessAddress: profile.spouseBusinessAddress?.toUpperCase() || null,
    },
    childrenInformation: {
      field14_numberOfChildren: profile.numChildren || 0,
    },
    incomeAndTaxPreviousYears: {
      field15_yearData: [], // Would need historical data - flagged as missing
    },
    declaration: {
      field16_signatureDate: null, // User signs after printing
      declarantName: summaryData.fullName?.toUpperCase() || '',
    },
    computedData: {
      totalIncome: computation.totalIncome || 0,
      taxableIncome: computation.taxableIncome || 0,
      taxOwed: computation.taxOwed || 0,
      monthlyPAYE: breakdown.monthlyPAYE || 0,
      incomeBreakdown: (summaryData.incomeRecords || []).map((r: any) => ({
        type: r.type,
        amount: r.amount,
        frequency: r.frequency,
        description: r.description,
      })),
      deductions: (summaryData.deductions || []).map((r: any) => ({
        type: r.type,
        amount: r.amount,
        description: r.description,
      })),
      cra: breakdown.cra
        ? {
            statutory: breakdown.cra.statutory,
            twentyPercent: breakdown.cra.twentyPercent,
            total: breakdown.cra.total,
          }
        : null,
    },
    supportingData: {
      benefitsInKind: summaryData.benefitsInKind || [],
      assetDeclarations: summaryData.assetDeclarations || [],
      capitalGains: summaryData.capitalGains || [],
      capitalAllowances: summaryData.capitalAllowances || [],
    },
  };

  return { schema, missingFields };
}

/**
 * Pretty format the schema for display
 */
export function formatSchemaForDisplay(schema: LIRSFormARequest): string {
  return JSON.stringify(schema, null, 2);
}
