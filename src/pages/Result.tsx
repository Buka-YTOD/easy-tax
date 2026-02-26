import { Link } from 'react-router-dom';
import { useComputation, useComputeTax } from '@/hooks/useComputation';
import { useIncome } from '@/hooks/useIncome';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { Calculator, FileText, ArrowRight, Loader2, Wallet, TrendingUp, Receipt, Sparkles } from 'lucide-react';

function BreakdownRow({ label, value, bold, indent }: { label: string; value: string; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 text-sm ${bold ? 'font-semibold border-t border-border pt-2' : ''} ${indent ? 'pl-4 text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function TaxBreakdown({ breakdown }: { breakdown: any }) {
  const incomeByType = breakdown.incomeByType || {};
  const deductionsByType = breakdown.deductionsByType || {};
  const brackets = breakdown.brackets || [];
  const cra = breakdown.cra || {};

  return (
    <div className="space-y-6">
      {/* Income Sources */}
      {Object.keys(incomeByType).length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Income Sources</h4>
          {Object.entries(incomeByType).map(([type, amount]) => (
            <BreakdownRow key={type} label={type} value={formatNaira(amount as number)} />
          ))}
          {breakdown.capitalGainsTotal > 0 && (
            <BreakdownRow label="Capital Gains" value={formatNaira(breakdown.capitalGainsTotal)} />
          )}
          <BreakdownRow label="Gross Income" value={formatNaira(breakdown.grossIncome)} bold />
        </div>
      )}

      {/* Deductions */}
      {(breakdown.deductionsTotal > 0 || Object.keys(deductionsByType).length > 0) && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Statutory Deductions</h4>
          {Object.entries(deductionsByType).map(([type, amount]) => (
            <BreakdownRow key={type} label={type} value={formatNaira(amount as number)} />
          ))}
          <BreakdownRow label="Total Deductions" value={formatNaira(breakdown.deductionsTotal)} bold />
        </div>
      )}

      {/* CRA */}
      {cra.total > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Consolidated Relief Allowance (CRA)</h4>
          <BreakdownRow label="Base Relief (higher of 1% or ₦200,000)" value={formatNaira(cra.base)} indent />
          <BreakdownRow label="20% of Gross Income" value={formatNaira(cra.twentyPercent)} indent />
          <BreakdownRow label="Total CRA" value={formatNaira(cra.total)} bold />
        </div>
      )}

      {/* Tax Brackets */}
      {brackets.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Tax Calculation</h4>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-3 py-2 font-medium">Bracket</th>
                  <th className="text-right px-3 py-2 font-medium">Rate</th>
                  <th className="text-right px-3 py-2 font-medium">Taxable</th>
                  <th className="text-right px-3 py-2 font-medium">Tax</th>
                </tr>
              </thead>
              <tbody>
                {brackets.map((b: any, i: number) => (
                  <tr key={i} className={`border-t border-border ${b.tax > 0 ? 'bg-primary/5' : ''}`}>
                    <td className="px-3 py-2">{b.bracket}</td>
                    <td className="px-3 py-2 text-right">{(b.rate * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNaira(b.taxableAmount)}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNaira(b.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly PAYE */}
      {breakdown.monthlyPAYE !== undefined && (
        <BreakdownRow label="Monthly PAYE" value={formatNaira(breakdown.monthlyPAYE)} bold />
      )}
    </div>
  );
}

export default function Result() {
  const { data: computation, isLoading } = useComputation();
  const { data: income = [] } = useIncome();
  const computeTax = useComputeTax();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-48 bg-muted rounded" />
      </div>
    );
  }

  if (!computation) {
    if (income.length === 0) {
      return (
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">No income data yet</h1>
          <p className="text-muted-foreground">
            You haven't added any income yet. Start with the guided interview to get set up, then come back to compute your tax.
          </p>
          <Link to="/app/guided">
            <Button size="lg">
              <Sparkles className="h-5 w-5 mr-2" /> Start Guided Interview
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Ready to compute?</h1>
        <p className="text-muted-foreground">
          We'll calculate your tax based on all the income, gains, and deductions you've provided.
        </p>
        <Button
          size="lg"
          onClick={() => computeTax.mutate()}
          disabled={computeTax.isPending}
        >
          {computeTax.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Computing...</>
          ) : (
            <><Calculator className="h-5 w-5 mr-2" /> Compute Tax</>
          )}
        </Button>
      </div>
    );
  }

  const breakdown = computation.breakdownJson ? JSON.parse(computation.breakdownJson) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Computation Result</h1>
        <p className="text-muted-foreground text-sm">
          Computed {new Date(computation.computedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Income" value={formatNaira(computation.totalIncome)} icon={Wallet} />
        <StatCard title="Taxable Income" value={formatNaira(computation.taxableIncome)} icon={TrendingUp} />
        <StatCard title="Tax Owed" value={formatNaira(computation.taxOwed)} icon={Receipt} variant="highlight" />
      </div>

      {breakdown && (
        <Card>
          <CardHeader><CardTitle className="text-base">How we calculated your tax</CardTitle></CardHeader>
          <CardContent>
            <TaxBreakdown breakdown={breakdown} />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-3 pb-6">
        <Button variant="outline" onClick={() => computeTax.mutate()} disabled={computeTax.isPending}>
          <Calculator className="h-4 w-4 mr-2" /> Recompute
        </Button>
        <Link to="/app/filing-pack">
          <Button>
            <FileText className="h-4 w-4 mr-2" /> Generate Filing Pack <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
