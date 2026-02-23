import { Link } from 'react-router-dom';
import { useComputation } from '@/hooks/useComputation';
import { useIncome } from '@/hooks/useIncome';
import { useDeductions } from '@/hooks/useDeductions';
import { useTaxProfile } from '@/hooks/useTaxProfile';
import { formatNaira } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingDown, Calculator, ArrowRight, Check, AlertTriangle } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  potentialSaving: number;
  priority: 'high' | 'medium' | 'low';
  action: string;
  actionPath: string;
}

function generateSuggestions(
  income: any[],
  deductions: any[],
  computation: any,
  profile: any
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const totalIncome = computation?.totalIncome || 0;

  // 1. Pension contribution check
  const hasPension = deductions.some(d => d.type === 'Pension');
  if (!hasPension && totalIncome > 0) {
    suggestions.push({
      id: 'pension',
      title: 'Contribute to a Pension Fund',
      description: 'Under the Pension Reform Act, you can deduct up to 8% of your gross income as employee pension contributions. This directly reduces your taxable income.',
      potentialSaving: Math.round(totalIncome * 0.08 * 0.21),
      priority: 'high',
      action: 'Add Pension Deduction',
      actionPath: '/app/manual/deductions',
    });
  }

  // 2. Health insurance
  const hasHealth = deductions.some(d => d.type === 'Health Insurance');
  if (!hasHealth && totalIncome > 1_000_000) {
    suggestions.push({
      id: 'health',
      title: 'Get Health Insurance (NHIS)',
      description: 'National Health Insurance Scheme contributions are tax-deductible. Premiums paid for yourself, spouse, and up to 4 children qualify.',
      potentialSaving: Math.round(Math.min(totalIncome * 0.05, 500_000) * 0.18),
      priority: 'high',
      action: 'Add Health Insurance',
      actionPath: '/app/manual/deductions',
    });
  }

  // 3. Mortgage interest
  const hasMortgage = deductions.some(d => d.type === 'Mortgage Interest');
  if (!hasMortgage && totalIncome > 5_000_000) {
    suggestions.push({
      id: 'mortgage',
      title: 'Claim Mortgage Interest Relief',
      description: 'If you have a mortgage on your primary residence, the interest portion is deductible. This can significantly reduce your tax bill.',
      potentialSaving: Math.round(Math.min(totalIncome * 0.1, 2_000_000) * 0.21),
      priority: 'medium',
      action: 'Add Mortgage Interest',
      actionPath: '/app/manual/deductions',
    });
  }

  // 4. Charitable donations
  const hasCharity = deductions.some(d => d.type === 'Charitable Donation');
  if (!hasCharity && totalIncome > 2_000_000) {
    suggestions.push({
      id: 'charity',
      title: 'Deduct Charitable Donations',
      description: 'Donations to approved charities, churches, and NGOs in Nigeria are tax-deductible up to 10% of your assessable income.',
      potentialSaving: Math.round(Math.min(totalIncome * 0.1, 1_000_000) * 0.18),
      priority: 'medium',
      action: 'Add Donation',
      actionPath: '/app/manual/deductions',
    });
  }

  // 5. Income splitting for business
  if (profile?.filingType === 'Individual' && income.some(r => r.type === 'Business')) {
    suggestions.push({
      id: 'business-filing',
      title: 'Consider Business Filing Type',
      description: 'If you have significant business income, filing as a business entity may allow you to take advantage of different tax brackets and deductions.',
      potentialSaving: Math.round(totalIncome * 0.03),
      priority: 'low',
      action: 'Update Filing Type',
      actionPath: '/app/settings',
    });
  }

  // 6. Education deduction
  const hasEducation = deductions.some(d => d.type === 'Education');
  if (!hasEducation) {
    suggestions.push({
      id: 'education',
      title: 'Claim Education Expenses',
      description: 'Professional development, certifications, and education expenses related to your income-generating activity may be deductible.',
      potentialSaving: Math.round(Math.min(totalIncome * 0.02, 500_000) * 0.15),
      priority: 'low',
      action: 'Add Education Expense',
      actionPath: '/app/manual/deductions',
    });
  }

  return suggestions.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 };
    return p[a.priority] - p[b.priority];
  });
}

const PRIORITY_STYLES = {
  high: 'border-primary/30 bg-primary/5',
  medium: 'border-accent',
  low: '',
};

export default function TaxOptimizer() {
  const { data: computation } = useComputation();
  const { data: income = [] } = useIncome();
  const { data: deductions = [] } = useDeductions();
  const { data: profile } = useTaxProfile();

  if (!computation) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Compute your tax first</h1>
        <p className="text-muted-foreground">We need your tax computation to suggest optimizations.</p>
        <Link to="/app/result">
          <Button size="lg"><Calculator className="h-5 w-5 mr-2" /> Go to Compute</Button>
        </Link>
      </div>
    );
  }

  const suggestions = generateSuggestions(income, deductions, computation, profile);
  const totalPotentialSaving = suggestions.reduce((s, sg) => s + sg.potentialSaving, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Optimization Advisor</h1>
        <p className="text-muted-foreground">Smart suggestions to reduce your tax liability</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingDown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(totalPotentialSaving)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Current tax: {formatNaira(computation.taxOwed)} · {suggestions.length} suggestions found
            </p>
          </div>
        </CardContent>
      </Card>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="h-12 w-12 mx-auto text-primary" />
            <h3 className="font-semibold text-lg mt-4">Great job!</h3>
            <p className="text-muted-foreground mt-1">You're already taking advantage of all common deductions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s) => (
            <Card key={s.id} className={PRIORITY_STYLES[s.priority]}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{s.title}</h3>
                      <Badge variant={s.priority === 'high' ? 'default' : s.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px]">
                        {s.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-medium text-primary">
                        Save up to {formatNaira(s.potentialSaving)}
                      </span>
                      <Link to={s.actionPath}>
                        <Button size="sm" variant="outline">
                          {s.action} <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>These are general suggestions based on Nigerian tax law. Consult a qualified tax advisor for personalized advice. Savings are estimates based on your income bracket.</p>
      </div>
    </div>
  );
}
