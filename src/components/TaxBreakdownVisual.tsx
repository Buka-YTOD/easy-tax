import { formatNaira } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, HelpCircle, Minus, Equal } from 'lucide-react';

interface TaxBreakdownVisualProps {
  breakdown: any;
  totalIncome: number;
  taxableIncome: number;
  taxOwed: number;
}

function FlowStep({ label, value, hint, variant = 'default' }: { label: string; value: string; hint?: string; variant?: 'default' | 'subtract' | 'result' }) {
  const bg = variant === 'subtract' ? 'bg-destructive/5 border-destructive/20' : variant === 'result' ? 'bg-primary/5 border-primary/20' : 'bg-card border-border';
  const icon = variant === 'subtract' ? <Minus className="h-3 w-3 text-destructive" /> : null;
  return (
    <div className={`rounded-lg border px-4 py-3 ${bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-muted-foreground">{label}</span>
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[240px] text-xs">
                {hint}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="font-semibold font-mono text-sm">{value}</span>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center py-0.5">
      <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
    </div>
  );
}

function BracketBar({ bracket, rate, taxableAmount, tax, maxAmount }: { bracket: string; rate: number; taxableAmount: number; tax: number; maxAmount: number }) {
  const pct = maxAmount > 0 ? Math.max((taxableAmount / maxAmount) * 100, 0) : 0;
  const isActive = taxableAmount > 0;

  return (
    <div className={`py-2.5 ${isActive ? '' : 'opacity-40'}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{bracket}</span>
        <div className="flex items-center gap-3">
          <span className={`font-medium px-1.5 py-0.5 rounded text-[10px] ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {(rate * 100).toFixed(0)}%
          </span>
          {isActive && <span className="font-mono text-xs">{formatNaira(tax)}</span>}
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isActive ? 'bg-primary' : 'bg-muted-foreground/20'}`}
          style={{ width: `${Math.max(pct, isActive ? 4 : 0)}%` }}
        />
      </div>
      {isActive && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatNaira(taxableAmount)} taxed at {(rate * 100).toFixed(0)}%
        </p>
      )}
    </div>
  );
}

export function TaxBreakdownVisual({ breakdown, totalIncome, taxableIncome, taxOwed }: TaxBreakdownVisualProps) {
  const incomeByType = breakdown.incomeByType || {};
  const deductionsByType = breakdown.deductionsByType || {};
  const brackets = breakdown.brackets || [];
  const cra = breakdown.cra || {};
  const maxBracketAmount = Math.max(...brackets.map((b: any) => b.taxableAmount || 0), 1);

  return (
    <div className="space-y-8">
      {/* ── STEP 1: Income Flow ── */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">1</span>
          Your Income
        </h3>
        <div className="space-y-1">
          {Object.entries(incomeByType).map(([type, amount]) => (
            <FlowStep key={type} label={type} value={formatNaira(amount as number)} />
          ))}
          {(breakdown.capitalGainsTotal || 0) > 0 && (
            <FlowStep label="Capital Gains" value={formatNaira(breakdown.capitalGainsTotal)} hint="Profits from selling assets like stocks, crypto, or property." />
          )}
          <FlowArrow />
          <FlowStep label="Gross Income" value={formatNaira(breakdown.grossIncome)} variant="result" />
        </div>
      </div>

      {/* ── STEP 2: What's Subtracted ── */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">2</span>
          What's Subtracted
          <span className="text-xs font-normal text-muted-foreground">(before tax is applied)</span>
        </h3>
        <div className="space-y-1">
          {Object.entries(deductionsByType).length > 0 && (
            <>
              {Object.entries(deductionsByType).map(([type, amount]) => (
                <FlowStep key={type} label={type} value={formatNaira(amount as number)} variant="subtract" />
              ))}
              <FlowArrow />
            </>
          )}

          {cra.total > 0 && (
            <Card className="border-dashed">
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Consolidated Relief Allowance</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[260px] text-xs">
                      Every taxpayer gets this automatic relief. It's the higher of ₦200,000 or 1% of your gross income, plus 20% of your gross income. This reduces how much of your income gets taxed.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="pl-3">Base relief (higher of 1% or ₦200k)</span>
                  <span className="font-mono">{formatNaira(cra.base)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="pl-3">20% of gross income</span>
                  <span className="font-mono">{formatNaira(cra.twentyPercent)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5">
                  <span>Total CRA</span>
                  <span className="font-mono">{formatNaira(cra.total)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <FlowArrow />

          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Equal className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold">Taxable Income</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px] text-xs">
                    This is the amount that actually gets taxed — your gross income minus all deductions and relief.
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-bold font-mono">{formatNaira(taxableIncome)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 3: Tax Brackets ── */}
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
          Tax Brackets Applied
        </h3>
        <p className="text-xs text-muted-foreground mb-3 pl-7">
          Your taxable income is split across progressive brackets — lower portions are taxed at lower rates.
        </p>
        <div className="rounded-lg border bg-card p-4 space-y-1">
          {brackets.map((b: any, i: number) => (
            <BracketBar key={i} bracket={b.bracket} rate={b.rate} taxableAmount={b.taxableAmount} tax={b.tax} maxAmount={maxBracketAmount} />
          ))}
        </div>
      </div>

      {/* ── Summary ── */}
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Tax</p>
        <p className="text-3xl font-bold font-mono text-primary">{formatNaira(taxOwed)}</p>
        {breakdown.monthlyPAYE !== undefined && (
          <p className="text-sm text-muted-foreground">
            That's <span className="font-semibold">{formatNaira(breakdown.monthlyPAYE)}/month</span> in PAYE
          </p>
        )}
      </div>
    </div>
  );
}
