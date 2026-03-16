import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTaxCalculatorChat, type CalcMessage, type TaxComputation } from '@/hooks/useTaxCalculatorChat';
import { useAppContext } from '@/contexts/AppContext';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Calculator, Send, Bot, User, Loader2, Trash2,
  DollarSign, TrendingDown, Receipt, PieChart,
} from 'lucide-react';

const SAMPLE_CSV = `Date,Description,Category,Amount,Balance
2023-10-01,Opening Balance - Business Account,Transfer,,"5,420.75"
2023-10-03,Payment - Blue Cross Blue Shield (Claim #4482),Insurance Income,"1,250.00","6,419.12"
2023-10-04,Office Rent (Oct) - Landmark Properties,Rent,"-2,500.00","3,919.12"
2023-10-06,Patient Co-pay - Card Payment (J. Doe),Patient Income,35.00,"3,804.12"
2023-10-10,Payment - Aetna Insurance (Claim #8912),Insurance Income,875.50,"3,774.20"
2023-10-16,Payment - Medicare (Claim #A4451),Insurance Income,"1,680.00","4,296.97"
2023-10-25,Payroll - Salary (Nurse R. Jones),Payroll,"-1,850.00","2,625.69"`;

function ComputationCard({ comp }: { comp: TaxComputation }) {
  return (
    <div className="space-y-3 mt-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-accent/50 p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Gross Income</p>
          <p className="text-sm font-bold">{formatNaira(comp.grossIncome)}</p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3 text-center">
          <TrendingDown className="h-4 w-4 mx-auto text-orange-500 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Deductions + CRA</p>
          <p className="text-sm font-bold">{formatNaira(comp.totalDeductions + comp.cra)}</p>
        </div>
        <div className="rounded-lg bg-accent/50 p-3 text-center">
          <Receipt className="h-4 w-4 mx-auto text-blue-500 mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Taxable Income</p>
          <p className="text-sm font-bold">{formatNaira(comp.taxableIncome)}</p>
        </div>
        <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
          <PieChart className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-[10px] uppercase text-muted-foreground">Tax Owed</p>
          <p className="text-sm font-bold text-primary">{formatNaira(comp.taxOwed)}</p>
        </div>
      </div>

      {/* Brackets table */}
      {comp.brackets && comp.brackets.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Bracket</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Rate</th>
                <th className="px-2 py-1.5 text-right font-medium text-muted-foreground">Tax</th>
              </tr>
            </thead>
            <tbody>
              {comp.brackets.map((b, i) => (
                <tr key={i} className={cn(b.taxableAmount > 0 ? 'bg-primary/5' : '')}>
                  <td className="px-2 py-1.5">{b.bracket}</td>
                  <td className="px-2 py-1.5 text-right">{(b.rate * 100).toFixed(0)}%</td>
                  <td className="px-2 py-1.5 text-right font-mono">{formatNaira(b.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Monthly PAYE */}
      <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Monthly PAYE</span>
        <span className="text-sm font-bold text-primary">{formatNaira(comp.monthlyPAYE)}</span>
      </div>
    </div>
  );
}

export default function Compute() {
  const { selectedTaxYear } = useAppContext();
  const { messages, isLoading, sendMessage, clearChat } = useTaxCalculatorChat();
  const [input, setInput] = useState('');
  const [useTextarea, setUseTextarea] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    setUseTextarea(false);
  };

  const handlePasteSample = () => {
    setInput(SAMPLE_CSV);
    setUseTextarea(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Tax Calculator</h1>
            <p className="text-xs text-muted-foreground">Chat-based tax computation for {selectedTaxYear}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground">
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Calculate Your Tax</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Paste your bank statement, enter your income details, or ask me any tax question. I'll compute your Nigerian tax liability step by step.
            </p>
            <div className="grid gap-2 w-full">
              <Button variant="outline" size="sm" onClick={handlePasteSample} className="justify-start text-xs">
                📋 Try with sample bank statement
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => sendMessage("I earn ₦5,000,000 monthly from employment and ₦200,000 monthly from freelancing. I also have pension contributions of ₦400,000 per year. Calculate my tax.")}
                className="justify-start text-xs"
              >
                💼 "I earn ₦5m/month from employment..."
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => sendMessage("Explain the Nigerian tax brackets for 2026")}
                className="justify-start text-xs"
              >
                📖 Explain tax brackets
              </Button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'max-w-[80%] bg-primary text-primary-foreground rounded-br-md'
                  : 'max-w-[90%] bg-card border rounded-bl-md'
              )}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_table]:border [&_th]:border [&_td]:border [&_th]:bg-muted/50">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              )}

              {msg.computation && <ComputationCard comp={msg.computation} />}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setUseTextarea(!useTextarea)}
            title={useTextarea ? 'Switch to single line' : 'Switch to multi-line (for pasting CSV)'}
          >
            <span className="text-xs font-mono">{useTextarea ? '—' : '≡'}</span>
          </Button>
          {useTextarea ? (
            <Textarea
              placeholder="Paste your bank statement or CSV data here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
              }}
              disabled={isLoading}
              className="min-h-[80px] max-h-[200px] text-sm"
            />
          ) : (
            <Input
              placeholder="Ask about your tax or paste income details..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isLoading}
            />
          )}
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {useTextarea ? '⌘/Ctrl + Enter to send • ' : ''}⚠ This is not legal advice. Consult a tax professional for official guidance.
        </p>
      </div>
    </div>
  );
}
