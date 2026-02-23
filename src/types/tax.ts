export type FilingType = 'Individual' | 'Business';
export type IncomeType = 'Employment' | 'Freelance' | 'Business' | 'Crypto' | 'Investment' | 'Rental' | 'Other';
export type Frequency = 'OneOff' | 'Monthly' | 'Annual';
export type AssetType = 'Crypto' | 'Stock' | 'Property' | 'Other';
export type FilingPackStatus = 'Draft' | 'Ready' | 'Submitted';

export interface TaxProfile {
  id: string;
  userId: string;
  taxYear: number;
  stateOfResidence: string;
  tin: string;
  filingType: FilingType;
  isResident: boolean;
}

export interface IncomeRecord {
  id: string;
  userId: string;
  taxYear: number;
  type: IncomeType;
  amount: number;
  frequency: Frequency;
  metadataJson: string;
  createdAt: string;
}

export interface CapitalGainRecord {
  id: string;
  userId: string;
  taxYear: number;
  assetType: AssetType;
  proceeds: number;
  costBasis: number;
  fees: number;
  realizedAt: string;
}

export interface TaxComputation {
  id: string;
  userId: string;
  taxYear: number;
  totalIncome: number;
  taxableIncome: number;
  taxOwed: number;
  breakdownJson: string;
  computedAt: string;
}

export interface FilingPack {
  id: string;
  userId: string;
  taxYear: number;
  summaryJson: string;
  status: FilingPackStatus;
  generatedAt: string;
}

export interface ClassifyIncomeResponse {
  suggestedType: IncomeType;
  confidence: number;
  extractedFields: {
    amount?: number;
    frequency?: Frequency;
    source?: string;
  };
  followUpQuestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  timestamp: string;
}
