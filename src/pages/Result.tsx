import { Link } from 'react-router-dom';
import { useComputation, useComputeTax } from '@/hooks/useComputation';
import { useIncome } from '@/hooks/useIncome';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { TaxBreakdownVisual } from '@/components/TaxBreakdownVisual';
import { TaxCharts } from '@/components/TaxCharts';
import { Calculator, FileText, ArrowRight, Loader2, Wallet, TrendingUp, Receipt, Sparkles } from 'lucide-react';

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
          <CardHeader>
            <CardTitle className="text-base">How we calculated your tax</CardTitle>
            <p className="text-xs text-muted-foreground">Step-by-step breakdown of your 2026 tax computation</p>
          </CardHeader>
          <CardContent>
            <TaxBreakdownVisual
              breakdown={breakdown}
              totalIncome={computation.totalIncome}
              taxableIncome={computation.taxableIncome}
              taxOwed={computation.taxOwed}
            />
          </CardContent>
        </Card>
      )}

      {breakdown && (
        <TaxCharts
          breakdown={breakdown}
          totalIncome={computation.totalIncome}
          taxOwed={computation.taxOwed}
        />
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
