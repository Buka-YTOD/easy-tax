import { Link } from 'react-router-dom';
import { useComputation, useComputeTax } from '@/hooks/useComputation';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { JsonViewer } from '@/components/JsonViewer';
import { Calculator, FileText, ArrowRight, Loader2, Wallet, TrendingUp, Receipt } from 'lucide-react';

export default function Result() {
  const { data: computation, isLoading } = useComputation();
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
          <CardHeader><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
          <CardContent>
            <JsonViewer data={breakdown} />
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
