import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { GuidedMessage, AIChatResponse, InterviewStage, SuggestedAction } from '@/types/guided';

const STORAGE_KEY = 'guided_session';

interface GuidedSession {
  conversationId: string;
  stage: InterviewStage;
  messages: GuidedMessage[];
}

function getSession(): GuidedSession | null {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : null;
  } catch {
    return null;
  }
}

function saveSession(session: GuidedSession) {
  const trimmed = { ...session, messages: session.messages.slice(-20) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// Mock AI that simulates the guided interview
function mockAIResponse(message: string, stage: InterviewStage): AIChatResponse {
  const lower = message.toLowerCase();

  // --- Specific answer matchers first (before generic stage checks) ---

  // "no" / "done" / "next" → advance to next stage
  if (lower.includes('no') || lower.includes('done') || lower.includes('next') || lower.includes("don't have")) {
    const nextStage: Record<InterviewStage, InterviewStage> = {
      profile: 'income',
      income: 'capital_gains',
      capital_gains: 'deductions',
      deductions: 'review',
      review: 'complete',
      complete: 'complete',
    };
    const next = nextStage[stage];
    if (next === 'review') {
      return {
        message: "Excellent! We've covered everything. Let's review what we've captured. Head over to the Review page to see a summary and make any edits before computing your tax.",
        stage: 'review',
        questions: [],
        suggestedActions: [],
        missingInfo: [],
        disclaimer: 'This is not legal advice.',
      };
    }
    // Recursively get the opening prompt for the next stage
    return mockAIResponse('__stage_open__', next);
  }

  // Profile: user answered filing type
  if (stage === 'profile' && (lower.includes('individual') || lower.includes('business'))) {
    const filingType = lower.includes('business') ? 'Business' : 'Individual';
    return {
      message: `Got it — filing as ${filingType}. Which state do you reside in?`,
      stage: 'profile',
      questions: [
        { id: 'state', label: 'State of Residence', type: 'text' },
      ],
      suggestedActions: [
        { type: 'update_profile', payload: { filingType }, confidence: 0.95 },
      ],
      missingInfo: ['state of residence'],
      disclaimer: 'This is not legal advice.',
    };
  }

  // Profile: user answered state → advance to income
  if (stage === 'profile' && lower !== '__stage_open__' && !lower.includes('start') && !lower.includes('begin') && lower.length > 1) {
    return {
      message: `Thanks! I've noted your state. Now let's move on to your income.`,
      stage: 'income',
      questions: [
        { id: 'income_desc', label: 'Describe your income', type: 'text' },
      ],
      suggestedActions: [
        { type: 'update_profile', payload: { stateOfResidence: message.trim() }, confidence: 0.85 },
      ],
      missingInfo: ['income sources'],
      disclaimer: 'This is not legal advice.',
    };
  }

  // Income: user described income with an amount
  if (stage === 'income') {
    const amountMatch = message.match(/₦?\s?([\d,]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;

    if (amount) {
      const type = lower.includes('freelance') ? 'Freelance'
        : lower.includes('business') ? 'Business'
        : lower.includes('rent') ? 'Rental'
        : lower.includes('invest') || lower.includes('dividend') ? 'Investment'
        : 'Employment';
      const frequency = lower.includes('annual') ? 'Annual' : lower.includes('one') ? 'OneOff' : 'Monthly';

      return {
        message: `I see — ${type} income of ₦${amount.toLocaleString()} (${frequency}). Let me add that for you. Any other income sources? Say "done" if not.`,
        stage: 'income',
        questions: [
          { id: 'more_income', label: 'Describe another income, or say "done"', type: 'text' },
        ],
        suggestedActions: [
          {
            type: 'create_income',
            payload: { type, amount, frequency, metadataJson: message },
            confidence: 0.9,
          },
        ],
        missingInfo: [],
        disclaimer: 'This is not legal advice.',
      };
    }
  }

  // Capital gains: user described a sale with amounts
  if (stage === 'capital_gains' && lower !== '__stage_open__') {
    const amounts = [...message.matchAll(/₦?\s?([\d,]+)/g)].map(m => parseFloat(m[1].replace(/,/g, '')));
    if (amounts.length >= 1) {
      const assetType = lower.includes('crypto') || lower.includes('bitcoin') ? 'Crypto'
        : lower.includes('stock') || lower.includes('share') ? 'Stock'
        : lower.includes('property') || lower.includes('land') || lower.includes('house') ? 'Property'
        : 'Other';
      return {
        message: `Got it — a ${assetType} sale. I'll add this. Any other asset sales? Say "done" if not.`,
        stage: 'capital_gains',
        questions: [
          { id: 'more_gains', label: 'Describe another sale, or say "done"', type: 'text' },
        ],
        suggestedActions: [
          {
            type: 'create_capital_gain',
            payload: { assetType, proceeds: amounts[0] || 0, costBasis: amounts[1] || 0, fees: amounts[2] || 0, realizedAt: new Date().toISOString() },
            confidence: 0.75,
          },
        ],
        missingInfo: [],
        disclaimer: 'This is not legal advice.',
      };
    }
  }

  // Deductions: user said yes
  if (stage === 'deductions' && (lower.includes('yes') || lower.includes('pension') || lower.includes('insurance') || lower.includes('donation'))) {
    return {
      message: "Great — tell me about your deductions. For example: 'I contribute ₦50,000 monthly to pension'.",
      stage: 'deductions',
      questions: [
        { id: 'deduction_desc', label: 'Describe your deduction', type: 'text' },
      ],
      suggestedActions: [],
      missingInfo: [],
      disclaimer: 'This is not legal advice.',
    };
  }

  // Deductions: user described a deduction with amount
  if (stage === 'deductions') {
    const amountMatch = message.match(/₦?\s?([\d,]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;
    if (amount) {
      const dtype = lower.includes('pension') ? 'Pension'
        : lower.includes('insurance') ? 'Health Insurance'
        : lower.includes('mortgage') ? 'Mortgage Interest'
        : lower.includes('donat') ? 'Charitable Donation'
        : 'Other';
      return {
        message: `Noted — ${dtype} deduction of ₦${amount.toLocaleString()}. Any more? Say "done" if not.`,
        stage: 'deductions',
        questions: [
          { id: 'more_deductions', label: 'Describe another, or say "done"', type: 'text' },
        ],
        suggestedActions: [
          { type: 'create_deduction', payload: { type: dtype, amount, description: message }, confidence: 0.85 },
        ],
        missingInfo: [],
        disclaimer: 'This is not legal advice.',
      };
    }
  }

  // --- Generic stage openers (only when entering a new stage) ---

  if (stage === 'profile') {
    return {
      message: "Great, let's get started! First, I need to know a bit about you. Are you filing as an individual or a business?",
      stage: 'profile',
      questions: [
        { id: 'filing_type', label: 'Filing type', type: 'select', options: ['Individual', 'Business'] },
      ],
      suggestedActions: [],
      missingInfo: ['state of residence', 'TIN'],
      disclaimer: 'This is not legal advice.',
    };
  }

  if (stage === 'income') {
    return {
      message: "Let's talk about your income. What are your sources of income? You can describe them in plain language — e.g., 'I earn ₦500,000 monthly from my job'.",
      stage: 'income',
      questions: [
        { id: 'income_desc', label: 'Describe your income', type: 'text' },
      ],
      suggestedActions: [],
      missingInfo: ['income sources'],
      disclaimer: 'This is not legal advice.',
    };
  }

  if (stage === 'capital_gains') {
    return {
      message: "Did you sell any assets this year — such as crypto, stocks, or property? Tell me about each sale, or say \"no\" to skip.",
      stage: 'capital_gains',
      questions: [
        { id: 'asset_desc', label: 'Describe what you sold, or say "no"', type: 'text' },
      ],
      suggestedActions: [],
      missingInfo: [],
      disclaimer: 'This is not legal advice.',
    };
  }

  if (stage === 'deductions') {
    return {
      message: "Do you have any deductions? For example: pension contributions, health insurance, or charitable donations.",
      stage: 'deductions',
      questions: [
        { id: 'has_deductions', label: 'Do you have deductions?', type: 'yesno' },
      ],
      suggestedActions: [],
      missingInfo: [],
      disclaimer: 'This is not legal advice.',
    };
  }

  return {
    message: "I understand. Could you tell me more? I'm here to help you through each step of your tax filing.",
    stage,
    questions: [{ id: 'followup', label: 'Tell me more', type: 'text' }],
    suggestedActions: [],
    missingInfo: [],
    disclaimer: 'This is not legal advice.',
  };
}

export function useGuidedInterview() {
  const { selectedTaxYear } = useAppContext();
  const [messages, setMessages] = useState<GuidedMessage[]>([]);
  const [stage, setStage] = useState<InterviewStage>('profile');
  const [conversationId] = useState(() => crypto.randomUUID());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setMessages(session.messages);
      setStage(session.stage);
    }
  }, []);

  useEffect(() => {
    saveSession({ conversationId, stage, messages });
  }, [conversationId, stage, messages]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: GuidedMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1200));

    const aiResponse = mockAIResponse(text, stage);
    setStage(aiResponse.stage);

    const assistantMsg: GuidedMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: aiResponse.message,
      questions: aiResponse.questions,
      suggestedActions: aiResponse.suggestedActions,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);
  }, [stage]);

  const startInterview = useCallback(() => {
    sendMessage("Let's start my tax filing for " + selectedTaxYear);
  }, [sendMessage, selectedTaxYear]);

  const resetSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([]);
    setStage('profile');
  }, []);

  return { messages, stage, isLoading, sendMessage, startInterview, resetSession, conversationId };
}
