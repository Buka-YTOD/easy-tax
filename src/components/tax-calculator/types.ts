export interface TaxFormData {
  incomeType: string;

  // Salary
  hasSalary: boolean;
  salaryAmount: number;
  salaryFrequency: 'monthly' | 'yearly';
  hasExtras: boolean;
  extrasAmount: number;

  // Business
  hasBusiness: boolean;
  businessProfit: number;

  // Freelance
  hasFreelance: boolean;
  freelanceIncome: number;

  // Contract
  hasContract: boolean;
  contractIncome: number;

  // Other income
  hasOtherIncome: boolean;
  otherIncomeAmount: number;

  // Passive income
  hasPassiveIncome: boolean;
  rentIncome: number;
  dividendIncome: number;
  interestIncome: number;
  royaltyIncome: number;

  // Deductions
  hasPension: boolean;
  pensionAmount: number;
  pensionFrequency: 'monthly' | 'yearly';
  hasNhf: boolean;
  nhfAmount: number;
  hasNhis: boolean;
  nhisAmount: number;
  hasLifeAssurance: boolean;
  lifeAssuranceAmount: number;

  // Rent relief
  paysRent: boolean;
  yearlyRent: number;

  // Family
  hasChildren: boolean;
  childrenCount: number;
  hasDependents: boolean;
  dependentsAmount: number;

  // Business adjustments
  hasBusinessLoss: boolean;
  businessLossAmount: number;
  boughtEquipment: boolean;
  equipmentCost: number;
  soldEquipment: boolean;
  equipmentSaleProceeds: number;
}

export type StepInputType = 'options' | 'yesno' | 'currency' | 'currency-frequency' | 'number';

export interface StepOption {
  label: string;
  value: string;
}

export interface Step {
  id: string;
  question: string;
  example?: string;
  type: StepInputType;
  options?: StepOption[];
  field: keyof TaxFormData;
  frequencyField?: keyof TaxFormData;
  shouldShow: (data: TaxFormData) => boolean;
}

export interface CompletedStep {
  step: Step;
  answer: string;
  displayAnswer: string;
}

export interface TaxBracketResult {
  bracket: string;
  rate: number;
  taxableAmount: number;
  tax: number;
}

export interface TaxResult {
  grossIncome: number;
  fiiExcluded: number;
  totalDeductions: number;
  rentRelief: number;
  familyReliefs: number;
  businessAdjustments: number;
  taxableIncome: number;
  taxOwed: number;
  monthlyPAYE: number;
  effectiveRate: number;
  brackets: TaxBracketResult[];
  incomeBreakdown: { label: string; amount: number }[];
  deductionBreakdown: { label: string; amount: number }[];
}

export const INITIAL_FORM_DATA: TaxFormData = {
  incomeType: '',
  hasSalary: false,
  salaryAmount: 0,
  salaryFrequency: 'monthly',
  hasExtras: false,
  extrasAmount: 0,
  hasBusiness: false,
  businessProfit: 0,
  hasFreelance: false,
  freelanceIncome: 0,
  hasContract: false,
  contractIncome: 0,
  hasOtherIncome: false,
  otherIncomeAmount: 0,
  hasPassiveIncome: false,
  rentIncome: 0,
  dividendIncome: 0,
  interestIncome: 0,
  royaltyIncome: 0,
  hasPension: false,
  pensionAmount: 0,
  pensionFrequency: 'monthly',
  hasNhf: false,
  nhfAmount: 0,
  hasNhis: false,
  nhisAmount: 0,
  hasLifeAssurance: false,
  lifeAssuranceAmount: 0,
  paysRent: false,
  yearlyRent: 0,
  hasChildren: false,
  childrenCount: 0,
  hasDependents: false,
  dependentsAmount: 0,
  hasBusinessLoss: false,
  businessLossAmount: 0,
  boughtEquipment: false,
  equipmentCost: 0,
  soldEquipment: false,
  equipmentSaleProceeds: 0,
};
