import { Link } from 'react-router-dom';
import { useIncome } from '@/hooks/useIncome';
import { useCapitalGains } from '@/hooks/useCapitalGains';
import { useDeductions } from '@/hooks/useDeductions';
import { useTaxProfile } from '@/hooks/useTaxProfile';
import { useAppContext } from '@/contexts/AppContext';
import { formatNaira } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Circle, Calculator, ArrowRight, Pencil } from 'lucide-react';

export default function Review() {
  const { selectedTaxYear } = useAppContext();
  const { data: profile } = useTaxProfile();
  const { data: income = [] } = useIncome();
  const { data: gains = [] } = useCapitalGains();
  const { data: deductions = [] } = useDeductions();

  const checklist = [
    { label: 'Tax profile configured', done: !!profile?.stateOfResidence },
    { label: 'At least one income record', done: income.length > 0 },
    { label: 'Capital gains reviewed', done: true },
    { label: 'Deductions reviewed', done: true },
  ];

  const totalIncome = income.reduce((s, r) => s + r.amount, 0);
  const totalGains = gains.reduce((s, r) => s + Math.max(0, r.proceeds - r.costBasis - r.fees), 0);
  const totalDeductions = deductions.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Your Data</h1>
        <p className="text-muted-foreground">Tax Year {selectedTaxYear} — review and edit before computing.</p>
      </div>

      {/* Checklist */}
      <Card>
        <CardHeader><CardTitle className="text-base">Completeness Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.done ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Profile</CardTitle>
          <Link to="/app/settings"><Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button></Link>
        </CardHeader>
        <CardContent>
          {profile?.stateOfResidence ? (
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Filing Type</span><span>{profile.filingType}</span>
              <span className="text-muted-foreground">State</span><span>{profile.stateOfResidence}</span>
              <span className="text-muted-foreground">Resident</span><span>{profile.isResident ? 'Yes' : 'No'}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not configured yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Income */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Income ({income.length})</CardTitle>
          <Link to="/app/manual/income"><Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button></Link>
        </CardHeader>
        <CardContent>
          {income.length > 0 ? (
            <div className="space-y-2">
              {income.map((r) => (
                <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{r.type} — {r.frequency}</span>
                  <span className="font-medium">{formatNaira(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Total</span><span>{formatNaira(totalIncome)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No income records.</p>
          )}
        </CardContent>
      </Card>

      {/* Capital Gains */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Capital Gains ({gains.length})</CardTitle>
          <Link to="/app/manual/capital-gains"><Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button></Link>
        </CardHeader>
        <CardContent>
          {gains.length > 0 ? (
            <div className="space-y-2">
              {gains.map((r) => (
                <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{r.assetType}</span>
                  <span className="font-medium">{formatNaira(r.proceeds - r.costBasis - r.fees)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Total Gains</span><span>{formatNaira(totalGains)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No capital gains.</p>
          )}
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Deductions ({deductions.length})</CardTitle>
          <Link to="/app/manual/deductions"><Button variant="ghost" size="sm"><Pencil className="h-3 w-3 mr-1" /> Edit</Button></Link>
        </CardHeader>
        <CardContent>
          {deductions.length > 0 ? (
            <div className="space-y-2">
              {deductions.map((r) => (
                <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{r.type}: {r.description}</span>
                  <span className="font-medium">{formatNaira(r.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-2">
                <span>Total Deductions</span><span>{formatNaira(totalDeductions)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No deductions.</p>
          )}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-center pb-6">
        <Link to="/app/result">
          <Button size="lg">
            <Calculator className="h-5 w-5 mr-2" /> Compute My Tax <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
