import type { TaxFormData, TaxResult, TaxBracketResult } from './types';

const BRACKETS = [
  { min: 0, max: 800_000, rate: 0, label: '₦0 – ₦800,000' },
  { min: 800_000, max: 3_200_000, rate: 0.15, label: '₦800,001 – ₦3,200,000' },
  { min: 3_200_000, max: 12_000_000, rate: 0.18, label: '₦3,200,001 – ₦12,000,000' },
  { min: 12_000_000, max: 25_000_000, rate: 0.21, label: '₦12,000,001 – ₦25,000,000' },
  { min: 25_000_000, max: Infinity, rate: 0.25, label: 'Above ₦25,000,000' },
];

// Children allowance: ₦2,500 per child (max 4)
const CHILD_ALLOWANCE = 2_500;
const MAX_CHILDREN = 4;

// Capital allowance rate (simplified): 50% initial + 25% annual
const CAPITAL_ALLOWANCE_RATE = 0.5;

function annualize(amount: number, frequency: 'monthly' | 'yearly'): number {
  return frequency === 'monthly' ? amount * 12 : amount;
}

function applyBrackets(taxableIncome: number): { tax: number; brackets: TaxBracketResult[] } {
  let remaining = Math.max(0, taxableIncome);
  let totalTax = 0;
  const brackets: TaxBracketResult[] = [];

  for (const b of BRACKETS) {
    const width = b.max === Infinity ? remaining : b.max - b.min;
    const taxable = Math.min(remaining, width);
    const tax = taxable * b.rate;
    brackets.push({ bracket: b.label, rate: b.rate, taxableAmount: taxable, tax });
    totalTax += tax;
    remaining -= taxable;
    if (remaining <= 0) break;
  }

  return { tax: totalTax, brackets };
}

export function computeTax(data: TaxFormData): TaxResult {
  // ─── INCOME ───
  const salary = annualize(data.salaryAmount, data.salaryFrequency);
  const extras = data.extrasAmount;
  const business = data.businessProfit;
  const freelance = data.freelanceIncome;
  const contract = data.contractIncome;
  const other = data.otherIncomeAmount;
  const rentInc = data.rentIncome;
  const royalty = data.royaltyIncome;
  const dividend = data.dividendIncome;
  const interest = data.interestIncome;

  const incomeBreakdown: { label: string; amount: number }[] = [];
  if (salary > 0) incomeBreakdown.push({ label: 'Salary', amount: salary });
  if (extras > 0) incomeBreakdown.push({ label: 'Extras & Benefits', amount: extras });
  if (business > 0) incomeBreakdown.push({ label: 'Business Profit', amount: business });
  if (freelance > 0) incomeBreakdown.push({ label: 'Freelance', amount: freelance });
  if (contract > 0) incomeBreakdown.push({ label: 'Contracts', amount: contract });
  if (other > 0) incomeBreakdown.push({ label: 'Other Income', amount: other });
  if (rentInc > 0) incomeBreakdown.push({ label: 'Rent Income', amount: rentInc });
  if (royalty > 0) incomeBreakdown.push({ label: 'Royalties', amount: royalty });

  const grossIncome = salary + extras + business + freelance + contract + other + rentInc + royalty;
  const fiiExcluded = dividend + interest;

  // ─── DEDUCTIONS ───
  const pension = annualize(data.pensionAmount, data.pensionFrequency);
  const nhf = data.nhfAmount;
  const nhis = data.nhisAmount;
  const lifeAssurance = data.lifeAssuranceAmount;

  const deductionBreakdown: { label: string; amount: number }[] = [];
  if (pension > 0) deductionBreakdown.push({ label: 'Pension', amount: pension });
  if (nhf > 0) deductionBreakdown.push({ label: 'NHF', amount: nhf });
  if (nhis > 0) deductionBreakdown.push({ label: 'NHIS', amount: nhis });
  if (lifeAssurance > 0) deductionBreakdown.push({ label: 'Life Assurance', amount: lifeAssurance });

  const totalDeductions = pension + nhf + nhis + lifeAssurance;

  // ─── RENT RELIEF ───
  const rentRelief = data.paysRent ? data.yearlyRent : 0;
  if (rentRelief > 0) deductionBreakdown.push({ label: 'Rent Relief', amount: rentRelief });

  // ─── FAMILY RELIEFS ───
  const childAllowance = data.hasChildren
    ? Math.min(data.childrenCount, MAX_CHILDREN) * CHILD_ALLOWANCE
    : 0;
  // Dependent relatives – not a direct deduction in current regime but noted
  const familyReliefs = childAllowance;
  if (childAllowance > 0) deductionBreakdown.push({ label: 'Children Allowance', amount: childAllowance });

  // ─── BUSINESS ADJUSTMENTS ───
  const lossRelief = data.hasBusinessLoss ? data.businessLossAmount : 0;
  const capitalAllowance = data.boughtEquipment ? data.equipmentCost * CAPITAL_ALLOWANCE_RATE : 0;
  const balancingCharge = data.soldEquipment ? data.equipmentSaleProceeds : 0;
  const businessAdjustments = lossRelief + capitalAllowance - balancingCharge;

  if (lossRelief > 0) deductionBreakdown.push({ label: 'Loss Relief', amount: lossRelief });
  if (capitalAllowance > 0) deductionBreakdown.push({ label: 'Capital Allowance', amount: capitalAllowance });
  if (balancingCharge > 0) deductionBreakdown.push({ label: 'Balancing Charge (added back)', amount: -balancingCharge });

  // ─── TAXABLE INCOME ───
  const taxableIncome = Math.max(0, grossIncome - totalDeductions - rentRelief - familyReliefs - Math.max(0, businessAdjustments));

  // ─── TAX ───
  const { tax, brackets } = applyBrackets(taxableIncome);
  const monthlyPAYE = tax / 12;
  const effectiveRate = grossIncome > 0 ? (tax / grossIncome) * 100 : 0;

  return {
    grossIncome,
    fiiExcluded,
    totalDeductions,
    rentRelief,
    familyReliefs,
    businessAdjustments: Math.max(0, businessAdjustments),
    taxableIncome,
    taxOwed: tax,
    monthlyPAYE,
    effectiveRate,
    brackets,
    incomeBreakdown,
    deductionBreakdown,
  };
}
