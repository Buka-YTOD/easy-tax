import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { formatNaira } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

const YEARS = [2024, 2025, 2026];

interface YearData {
  year: string;
  income: number;
  deductions: number;
  taxOwed: number;
  hasComputation: boolean;
}

function useYearComparison() {
  const { user } = useAppContext();

  return useQuery({
    queryKey: ['yearComparison', user?.id],
    queryFn: async (): Promise<YearData[]> => {
      if (!user) return [];

      // Get all returns for the user
      const { data: returns } = await supabase
        .from('tax_returns')
        .select('id, tax_year')
        .eq('user_id', user.id)
        .in('tax_year', YEARS);

      if (!returns || returns.length === 0) return YEARS.map(y => ({ year: `TY ${y}`, income: 0, deductions: 0, taxOwed: 0, hasComputation: false }));

      // Get active scenarios for each return
      const returnIds = returns.map(r => r.id);
      const { data: scenarios } = await supabase
        .from('return_scenarios')
        .select('id, return_id, is_active')
        .in('return_id', returnIds)
        .eq('is_active', true);

      const scenarioMap = new Map((scenarios ?? []).map(s => [s.return_id, s.id]));

      const results: YearData[] = [];
      for (const year of YEARS) {
        const ret = returns.find(r => r.tax_year === year);
        if (!ret) {
          results.push({ year: `TY ${year}`, income: 0, deductions: 0, taxOwed: 0, hasComputation: false });
          continue;
        }
        const scenarioId = scenarioMap.get(ret.id);
        if (!scenarioId) {
          results.push({ year: `TY ${year}`, income: 0, deductions: 0, taxOwed: 0, hasComputation: false });
          continue;
        }

        const [incomeRes, deductionRes, compRes] = await Promise.all([
          supabase.from('income_records').select('amount, frequency').eq('scenario_id', scenarioId),
          supabase.from('deductions').select('amount').eq('scenario_id', scenarioId),
          supabase.from('computations').select('tax_owed').eq('scenario_id', scenarioId).maybeSingle(),
        ]);

        const totalIncome = (incomeRes.data ?? []).reduce((s, r) => {
          if (r.frequency === 'Monthly') return s + Number(r.amount) * 12;
          return s + Number(r.amount);
        }, 0);
        const totalDeductions = (deductionRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

        results.push({
          year: `TY ${year}`,
          income: totalIncome,
          deductions: totalDeductions,
          taxOwed: compRes.data ? Number(compRes.data.tax_owed) : 0,
          hasComputation: !!compRes.data,
        });
      }

      return results;
    },
    enabled: !!user,
  });
}

function TrendIcon({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 || current === previous) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (current > previous) return <TrendingUp className="h-4 w-4 text-destructive" />;
  return <TrendingDown className="h-4 w-4 text-primary" />;
}

export default function YearComparison() {
  const { data = [], isLoading } = useYearComparison();
  const hasAnyData = data.some(d => d.income > 0 || d.taxOwed > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Year-over-Year Comparison</h1>
        <p className="text-muted-foreground">Track your tax liability trends across years</p>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mt-4">No data yet</h3>
            <p className="text-muted-foreground mt-1">Add income and compute taxes across different years to see comparisons.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.map((d, i) => (
              <Card key={d.year}>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground font-medium">{d.year}</p>
                  <p className="text-xl font-bold mt-1">{formatNaira(d.taxOwed)}</p>
                  <p className="text-xs text-muted-foreground">tax owed</p>
                  {i > 0 && d.taxOwed > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs">
                      <TrendIcon current={d.taxOwed} previous={data[i - 1].taxOwed} />
                      <span className="text-muted-foreground">
                        {data[i - 1].taxOwed > 0
                          ? `${Math.round(((d.taxOwed - data[i - 1].taxOwed) / data[i - 1].taxOwed) * 100)}% vs prev year`
                          : 'No previous data'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Income vs Tax</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => formatNaira(value)}
                      contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deductions" name="Deductions" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="taxOwed" name="Tax Owed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Detailed Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="font-medium text-muted-foreground">Metric</div>
                {data.map(d => <div key={d.year} className="font-medium text-center">{d.year}</div>)}
                
                <div className="text-muted-foreground border-t pt-2">Total Income</div>
                {data.map(d => <div key={d.year} className="text-center border-t pt-2">{formatNaira(d.income)}</div>)}
                
                <div className="text-muted-foreground">Deductions</div>
                {data.map(d => <div key={d.year} className="text-center">{formatNaira(d.deductions)}</div>)}
                
                <div className="text-muted-foreground">Tax Owed</div>
                {data.map(d => <div key={d.year} className="text-center font-semibold">{d.hasComputation ? formatNaira(d.taxOwed) : '—'}</div>)}
                
                <div className="text-muted-foreground">Effective Rate</div>
                {data.map(d => (
                  <div key={d.year} className="text-center">
                    {d.hasComputation && d.income > 0 ? `${((d.taxOwed / d.income) * 100).toFixed(1)}%` : '—'}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
