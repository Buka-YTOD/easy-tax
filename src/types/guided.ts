export type InterviewStage = 'profile' | 'income' | 'capital_gains' | 'deductions' | 'review' | 'complete';

export type QuestionType = 'text' | 'number' | 'currency' | 'date' | 'select' | 'yesno';

export interface AIQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
}

export type SuggestedActionType =
  | 'create_income'
  | 'create_capital_gain'
  | 'create_deduction'
  | 'update_profile'
  | 'compute_tax'
  | 'generate_filing_pack';

export interface SuggestedAction {
  type: SuggestedActionType;
  payload: Record<string, unknown>;
  confidence: number;
}

export interface AIChatResponse {
  message: string;
  stage: InterviewStage;
  questions: AIQuestion[];
  suggestedActions: SuggestedAction[];
  missingInfo: string[];
  disclaimer: string;
}

export interface GuidedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  questions?: AIQuestion[];
  suggestedActions?: SuggestedAction[];
  timestamp: string;
}

export interface DeductionRecord {
  id: string;
  userId: string;
  taxYear: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}
