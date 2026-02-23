import { useMutation } from '@tanstack/react-query';
import type { ClassifyIncomeResponse, ChatMessage } from '@/types/tax';

export function useClassifyIncome() {
  return useMutation({
    mutationFn: async (text: string): Promise<ClassifyIncomeResponse> => {
      await new Promise(r => setTimeout(r, 1500));

      const lower = text.toLowerCase();
      let suggestedType: ClassifyIncomeResponse['suggestedType'] = 'Other';
      let amount: number | undefined;
      let frequency: ClassifyIncomeResponse['extractedFields']['frequency'] = 'OneOff';

      if (lower.includes('salary') || lower.includes('employment') || lower.includes('job')) {
        suggestedType = 'Employment';
        frequency = 'Monthly';
      } else if (lower.includes('freelance') || lower.includes('contract') || lower.includes('gig')) {
        suggestedType = 'Freelance';
      } else if (lower.includes('rent') || lower.includes('property') || lower.includes('tenant')) {
        suggestedType = 'Rental';
        frequency = 'Monthly';
      } else if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('trading')) {
        suggestedType = 'Crypto';
      } else if (lower.includes('business') || lower.includes('shop') || lower.includes('company')) {
        suggestedType = 'Business';
      } else if (lower.includes('dividend') || lower.includes('investment') || lower.includes('stock')) {
        suggestedType = 'Investment';
      }

      const amountMatch = text.match(/₦?\s?([\d,]+(?:\.\d{2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      return {
        suggestedType,
        confidence: 0.85,
        extractedFields: { amount, frequency, source: text.slice(0, 50) },
        followUpQuestions: [
          'Is this a recurring income source?',
          'Do you have documentation for this income?',
          'Are there any associated deductions?',
        ],
      };
    },
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: async ({ message }: { message: string; conversationId: string }): Promise<ChatMessage> => {
      await new Promise(r => setTimeout(r, 1000));

      const responses: Record<string, string> = {
        default:
          "Based on the Nigerian Tax Act 2026, I can help you understand your tax obligations. The progressive tax system applies rates from 0% to 25% depending on your income bracket. Would you like me to explain a specific aspect?",
        bracket:
          "The Nigerian Tax Act 2026 uses progressive brackets:\n\n• ₦0 – ₦800,000: 0%\n• ₦800,001 – ₦3,200,000: 15%\n• ₦3,200,001 – ₦12,000,000: 18%\n• ₦12,000,001 – ₦25,000,000: 21%\n• Above ₦25,000,000: 25%",
        capital:
          "Capital gains from crypto, stocks, and property are included in your total income and taxed progressively under the 2026 Act. The gain is calculated as: Proceeds - Cost Basis - Fees.",
      };

      const lower = message.toLowerCase();
      let response = responses.default;
      if (lower.includes('bracket') || lower.includes('rate')) response = responses.bracket;
      if (lower.includes('capital') || lower.includes('gain') || lower.includes('crypto'))
        response = responses.capital;

      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        citations: ['Nigerian Tax Act 2026, Section 15'],
        timestamp: new Date().toISOString(),
      };
    },
  });
}
