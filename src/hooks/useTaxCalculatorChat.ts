import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaxComputation {
  grossIncome: number;
  totalDeductions: number;
  cra: number;
  taxableIncome: number;
  taxOwed: number;
  monthlyPAYE: number;
  brackets: Array<{ bracket: string; rate: number; taxableAmount: number; tax: number }>;
  incomeBreakdown: Array<{ category: string; amount: number }>;
  deductionBreakdown: Array<{ category: string; amount: number }>;
}

export interface CalcMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  computation?: TaxComputation | null;
  timestamp: string;
}

export function useTaxCalculatorChat() {
  const [messages, setMessages] = useState<CalcMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: CalcMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('tax-calculator-chat', {
        body: { messages: history },
      });

      if (error) throw error;

      const assistantMsg: CalcMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message || 'I couldn\'t process that. Please try again.',
        computation: data.hasComputation ? data.computation : null,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Tax calculator chat error:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to get AI response',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
