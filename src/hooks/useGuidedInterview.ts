import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { GuidedMessage, AIChatResponse, InterviewStage } from '@/types/guided';

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

const AUTO_CONFIRM_TYPES = ['update_profile'];

export function useGuidedInterview(onAutoConfirm?: (actions: import('@/types/guided').SuggestedAction[]) => void) {
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

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/guided-interview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token || ''}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: updatedMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            stage,
          }),
        }
      );

      if (!res.ok) throw new Error('AI request failed');

      const aiResponse: AIChatResponse = await res.json();
      setStage(aiResponse.stage);

      const autoActions = (aiResponse.suggestedActions || []).filter(a => AUTO_CONFIRM_TYPES.includes(a.type));
      const visibleActions = (aiResponse.suggestedActions || []).filter(a => !AUTO_CONFIRM_TYPES.includes(a.type));

      const assistantMsg: GuidedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiResponse.message,
        questions: aiResponse.questions,
        suggestedActions: visibleActions,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-confirm profile updates silently
      if (autoActions.length > 0 && onAutoConfirm) {
        onAutoConfirm(autoActions);
      }
    } catch (err) {
      console.error('Guided interview error:', err);
      const errorMsg: GuidedMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [stage, messages]);

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
