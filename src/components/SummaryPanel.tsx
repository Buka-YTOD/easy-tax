import { useIncome } from '@/hooks/useIncome';
import { useCapitalGains } from '@/hooks/useCapitalGains';
import { useDeductions } from '@/hooks/useDeductions';
import { useTaxProfile } from '@/hooks/useTaxProfile';
import { useBenefitsInKind } from '@/hooks/useBenefitsInKind';
import { useAssetDeclarations } from '@/hooks/useAssetDeclarations';
import { useCapitalAllowances } from '@/hooks/useCapitalAllowances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SummaryPanel({ className }: { className?: string }) {
  const { data: income = [] } = useIncome();
  const { data: gains = [] } = useCapitalGains();
  const { data: deductions = [] } = useDeductions();
  const { data: profile } = useTaxProfile();
  const { data: bik = [] } = useBenefitsInKind();
  const { data: assets = [] } = useAssetDeclarations();
  const { data: allowances = [] } = useCapitalAllowances();

  const items = [
    { label: 'Profile', count: profile?.stateOfResidence ? 1 : 0, target: 1 },
    { label: 'Income Records', count: income.length, target: 1 },
    { label: 'Capital Gains', count: gains.length, target: 0 },
    { label: 'Deductions', count: deductions.length, target: 0 },
    { label: 'Benefits in Kind', count: bik.length, target: 0 },
    { label: 'Assets', count: assets.length, target: 0 },
    { label: 'Allowances', count: allowances.length, target: 0 },
  ];

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Captured So Far</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const done = item.count >= item.target && item.target > 0;
          return (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {done ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={cn(done ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
              </div>
              <span className="font-medium text-foreground">{item.count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
