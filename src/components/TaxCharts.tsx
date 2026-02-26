import { formatNaira } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 160 60% 45%))',
  'hsl(var(--chart-3, 30 80% 55%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
];

interface TaxChartsProps {
  breakdown: any;
  totalIncome: number;
  taxOwed: number;
}

export function TaxCharts({ breakdown, totalIncome, taxOwed }: TaxChartsProps) {
  const incomeByType = breakdown.incomeByType || {};
  const brackets = breakdown.brackets || [];

  // Income pie data
  const incomeData = Object.entries(incomeByType).map(([name, value]) => ({
    name,
    value: value as number,
  }));
  if ((breakdown.capitalGainsTotal || 0) > 0) {
    incomeData.push({ name: 'Capital Gains', value: breakdown.capitalGainsTotal });
  }

  // Tax bracket bar data (only active ones)
  const bracketData = brackets
    .filter((b: any) => b.taxableAmount > 0)
    .map((b: any) => ({
      name: b.bracket.replace('₦', '₦').replace('–', '–'),
      taxableAmount: b.taxableAmount,
      tax: b.tax,
      rate: `${(b.rate * 100).toFixed(0)}%`,
    }));

  const takeHome = Math.max(totalIncome - taxOwed, 0);
  const splitData = [
    { name: 'Take-Home', value: takeHome },
    { name: 'Tax', value: taxOwed },
  ];

  const incomeConfig: ChartConfig = Object.fromEntries(
    incomeData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }])
  );

  const splitConfig: ChartConfig = {
    'Take-Home': { label: 'Take-Home', color: 'hsl(var(--chart-2, 160 60% 45%))' },
    Tax: { label: 'Tax', color: 'hsl(var(--destructive))' },
  };

  const bracketConfig: ChartConfig = {
    taxableAmount: { label: 'Amount in Bracket', color: 'hsl(var(--primary))' },
    tax: { label: 'Tax from Bracket', color: 'hsl(var(--destructive))' },
  };

  const renderPieLabel = ({ name, percent }: any) =>
    percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Income by Type */}
      {incomeData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={incomeConfig} className="aspect-square max-h-[220px] w-full">
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={false}
                >
                  {incomeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} className="outline-none" />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatNaira(value as number)}
                    />
                  }
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Tax vs Take-Home */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tax vs Take-Home</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={splitConfig} className="aspect-square max-h-[220px] w-full">
            <PieChart>
              <Pie
                data={splitData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={renderPieLabel}
                labelLine={false}
              >
                <Cell fill="hsl(var(--chart-2, 160 60% 45%))" className="outline-none" />
                <Cell fill="hsl(var(--destructive))" className="outline-none" />
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatNaira(value as number)}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(var(--chart-2, 160 60% 45%))' }} />
              <span className="text-muted-foreground">Take-Home</span>
              <span className="font-mono font-medium">{formatNaira(takeHome)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ background: 'hsl(var(--destructive))' }} />
              <span className="text-muted-foreground">Tax</span>
              <span className="font-mono font-medium">{formatNaira(taxOwed)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Bracket Distribution */}
      {bracketData.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tax Bracket Distribution</CardTitle>
            <p className="text-xs text-muted-foreground">How your income is taxed across brackets</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={bracketConfig} className="h-[200px] w-full">
              <BarChart data={bracketData} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <YAxis type="category" dataKey="rate" width={40} className="text-xs" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatNaira(value as number)}
                    />
                  }
                />
                <Bar dataKey="taxableAmount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
                <Bar dataKey="tax" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
