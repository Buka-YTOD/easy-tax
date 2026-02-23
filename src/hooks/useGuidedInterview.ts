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

  if (stage === 'profile' || lower.includes('start') || lower.includes('begin')) {
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

  if (stage === 'income' || lower.includes('income') || lower.includes('salary') || lower.includes('employment')) {
    const amountMatch = message.match(/₦?\s?([\d,]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : undefined;

    if (amount) {
      return {
        message: `I see you earn ${amount.toLocaleString()} monthly from employment. Let me add that for you.`,
        stage: 'income',
        questions: [],
        suggestedActions: [
          {
            type: 'create_income',
            payload: { type: 'Employment', amount, frequency: 'Monthly', metadataJson: message },
            confidence: 0.9,
          },
        ],
        missingInfo: [],
        disclaimer: 'This is not legal advice.',
      };
    }

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

  if (stage === 'capital_gains' || lower.includes('crypto') || lower.includes('stock') || lower.includes('sold')) {
    return {
      message: "Did you sell any assets this year — such as crypto, stocks, or property? Tell me about each sale.",
      stage: 'capital_gains',
      questions: [
        { id: 'asset_desc', label: 'Describe what you sold', type: 'text' },
      ],
      suggestedActions: [],
      missingInfo: [],
      disclaimer: 'This is not legal advice.',
    };
  }

  if (stage === 'deductions' || lower.includes('deduction') || lower.includes('pension') || lower.includes('insurance')) {
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

  if (lower.includes('no') || lower.includes('done') || lower.includes('next')) {
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
    return mockAIResponse('', next);
  }

  // Profile answers
  if (lower.includes('individual') || lower.includes('business')) {
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
