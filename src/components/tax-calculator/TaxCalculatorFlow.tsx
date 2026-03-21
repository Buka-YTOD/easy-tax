import { useState, useRef, useEffect, useCallback } from 'react';
import { STEPS } from './steps';
import { computeTax } from './computeTax';
import { INITIAL_FORM_DATA, type TaxFormData, type CompletedStep, type TaxResult } from './types';
import { formatNaira } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import {
  Bot, User, Calculator, RotateCcw, ArrowRight,
  DollarSign, TrendingDown, Receipt, PieChart, CheckCircle2,
} from 'lucide-react';

function ResultDisplay({ result }: { result: TaxResult }) {
  return (
    <div className="space-y-4 mt-2">
      <p className="text-sm font-medium">Here's your tax breakdown 📊</p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: DollarSign, label: 'Gross Income', value: result.grossIncome, color: 'text-primary' },
          { icon: TrendingDown, label: 'Total Reliefs', value: result.totalDeductions + result.rentRelief + result.familyReliefs + result.businessAdjustments, color: 'text-orange-500' },
          { icon: Receipt, label: 'Taxable Income', value: result.taxableIncome, color: 'text-blue-500' },
          { icon: PieChart, label: 'Estimated Tax', value: result.taxOwed, color: 'text-primary' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-lg bg-accent/50 p-3 text-center">
            <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
            <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
            <p className="text-sm font-bold">{formatNaira(value)}</p>
          </div>
        ))}
      </div>

      {result.fiiExcluded > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 inline mr-1" />
          ₦{result.fiiExcluded.toLocaleString()} in dividends & interest was excluded (already taxed at source).
        </div>
      )}

      {result.incomeBreakdown.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">Income Sources</div>
          <table className="w-full text-xs">
            <tbody>
              {result.incomeBreakdown.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-1.5">{r.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.brackets.filter(b => b.taxableAmount > 0).length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">Tax Brackets</div>
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">Bracket</th>
                <th className="px-3 py-1.5 text-right font-medium">Rate</th>
                <th className="px-3 py-1.5 text-right font-medium">Tax</th>
              </tr>
            </thead>
            <tbody>
              {result.brackets.filter(b => b.taxableAmount > 0).map((b, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-1.5">{b.bracket}</td>
                  <td className="px-3 py-1.5 text-right">{(b.rate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-1.5 text-right font-mono">{formatNaira(b.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Monthly PAYE</span>
        <span className="text-sm font-bold text-primary">{formatNaira(result.monthlyPAYE)}</span>
      </div>

      <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Effective Tax Rate</span>
        <span className="text-sm font-bold text-primary">{result.effectiveRate.toFixed(1)}%</span>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2">
        We removed pension, rent, and already-taxed income before calculating. This is an estimate — consult a tax professional for official guidance.
      </p>
    </div>
  );
}

export default function TaxCalculatorFlow() {
  const [formData, setFormData] = useState<TaxFormData>({ ...INITIAL_FORM_DATA });
  const [completed, setCompleted] = useState<CompletedStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [currencyInput, setCurrencyInput] = useState('');
  const [numberInput, setNumberInput] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [result, setResult] = useState<TaxResult | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [completed, result]);

  // Find the next visible step from a given index
  const findNextStep = useCallback((fromIdx: number, data: TaxFormData): number => {
    for (let i = fromIdx; i < STEPS.length; i++) {
      if (STEPS[i].shouldShow(data)) return i;
    }
    return -1; // no more steps
  }, []);

  const currentStep = currentStepIdx >= 0 && currentStepIdx < STEPS.length ? STEPS[currentStepIdx] : null;

  const totalVisibleSteps = STEPS.filter(s => s.shouldShow(formData)).length;
  const completedCount = completed.length;
  const progress = result ? 100 : totalVisibleSteps > 0 ? (completedCount / (totalVisibleSteps + 1)) * 100 : 0;

  const advance = useCallback((newData: TaxFormData, displayAnswer: string) => {
    if (!currentStep) return;

    setCompleted(prev => [...prev, { step: currentStep, answer: String(newData[currentStep.field]), displayAnswer }]);

    const nextIdx = findNextStep(currentStepIdx + 1, newData);
    if (nextIdx === -1) {
      // All steps done — compute
      setResult(computeTax(newData));
      setCurrentStepIdx(-1);
    } else {
      setCurrentStepIdx(nextIdx);
    }
    setCurrencyInput('');
    setNumberInput('');
  }, [currentStep, currentStepIdx, findNextStep]);

  const handleOption = (value: string, label: string) => {
    const newData = { ...formData, [currentStep!.field]: value };
    // Auto-set flags for single income types
    if (currentStep!.id === 'intro' || currentStep!.id === 'unsure_help') {
      if (value === 'salary') newData.hasSalary = true;
      if (value === 'business') newData.hasBusiness = true;
      if (value === 'freelance') newData.hasFreelance = true;
    }
    setFormData(newData);
    advance(newData, label);
  };

  const handleYesNo = (yes: boolean) => {
    const newData = { ...formData, [currentStep!.field]: yes };
    setFormData(newData);
    advance(newData, yes ? 'Yes' : 'No');
  };

  const handleCurrency = () => {
    const raw = currencyInput.replace(/[^0-9.]/g, '');
    const amount = parseFloat(raw) || 0;
    if (amount <= 0) return;

    const newData = { ...formData, [currentStep!.field]: amount };
    if (currentStep!.frequencyField) {
      (newData as any)[currentStep!.frequencyField] = frequency;
    }
    setFormData(newData);

    const freqLabel = currentStep!.frequencyField ? ` (${frequency})` : '';
    advance(newData, `₦${amount.toLocaleString()}${freqLabel}`);
  };

  const handleNumber = () => {
    const num = parseInt(numberInput) || 0;
    if (num <= 0) return;
    const newData = { ...formData, [currentStep!.field]: num };
    setFormData(newData);
    advance(newData, String(num));
  };

  const handleSkip = () => {
    if (!currentStep) return;
    const newData = { ...formData };
    advance(newData, 'Skipped');
  };

  const handleRestart = () => {
    setFormData({ ...INITIAL_FORM_DATA });
    setCompleted([]);
    setCurrentStepIdx(0);
    setResult(null);
    setCurrencyInput('');
    setNumberInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold">Tax Calculator</h1>
            <p className="text-xs text-muted-foreground">Step-by-step tax computation</p>
          </div>
        </div>
        {completed.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleRestart} className="text-muted-foreground">
            <RotateCcw className="h-4 w-4 mr-1" /> Start Over
          </Button>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 py-2 bg-card border-b">
        <Progress value={progress} className="h-1.5" />
        <p className="text-[10px] text-muted-foreground mt-1">
          {result ? 'Complete ✓' : `Step ${completedCount + 1}`}
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Completed Q&A pairs */}
        {completed.map((c, i) => (
          <div key={i} className="space-y-2">
            {/* Question */}
            <div className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card border px-4 py-3 text-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{c.step.question}</ReactMarkdown>
                </div>
                {c.step.example && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{c.step.example}</p>
                )}
              </div>
            </div>
            {/* Answer */}
            <div className="flex gap-3 justify-end">
              <div className="max-w-[70%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-4 py-2.5 text-sm">
                {c.displayAnswer}
              </div>
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}

        {/* Current question */}
        {currentStep && !result && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-card border px-4 py-3 text-sm">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{currentStep.question}</ReactMarkdown>
                </div>
                {currentStep.example && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{currentStep.example}</p>
                )}

                {/* Inline controls */}
                <div className="mt-3 space-y-2">
                  {currentStep.type === 'options' && currentStep.options && (
                    <div className="flex flex-col gap-1.5">
                      {currentStep.options.map(opt => (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          className="justify-start text-xs h-auto py-2 px-3"
                          onClick={() => handleOption(opt.value, opt.label)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {currentStep.type === 'yesno' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleYesNo(true)} className="flex-1">Yes</Button>
                      <Button size="sm" variant="outline" onClick={() => handleYesNo(false)} className="flex-1">No</Button>
                    </div>
                  )}

                  {currentStep.type === 'currency' && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={currencyInput}
                          onChange={(e) => setCurrencyInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCurrency()}
                          className="pl-7 text-sm"
                          autoFocus
                        />
                      </div>
                      <Button size="icon" onClick={handleCurrency} disabled={!currencyInput}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {currentStep.type === 'currency-frequency' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₦</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={currencyInput}
                            onChange={(e) => setCurrencyInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCurrency()}
                            className="pl-7 text-sm"
                            autoFocus
                          />
                        </div>
                        <Button size="icon" onClick={handleCurrency} disabled={!currencyInput}>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={frequency === 'monthly' ? 'default' : 'outline'}
                          onClick={() => setFrequency('monthly')}
                          className="flex-1 text-xs"
                        >
                          Monthly
                        </Button>
                        <Button
                          size="sm"
                          variant={frequency === 'yearly' ? 'default' : 'outline'}
                          onClick={() => setFrequency('yearly')}
                          className="flex-1 text-xs"
                        >
                          Yearly
                        </Button>
                      </div>
                    </div>
                  )}

                  {currentStep.type === 'number' && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={numberInput}
                        onChange={(e) => setNumberInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNumber()}
                        className="text-sm"
                        autoFocus
                      />
                      <Button size="icon" onClick={handleNumber} disabled={!numberInput}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Skip button for currency/number inputs */}
                  {(currentStep.type === 'currency' || currentStep.type === 'currency-frequency' || currentStep.type === 'number') && (
                    <Button variant="ghost" size="sm" onClick={handleSkip} className="text-xs text-muted-foreground w-full">
                      Skip this question
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-card border px-4 py-3 text-sm">
              <ResultDisplay result={result} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
