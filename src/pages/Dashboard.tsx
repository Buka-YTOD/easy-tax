import { Link } from 'react-router-dom';
import { useComputation } from '@/hooks/useComputation';
import { useIncome } from '@/hooks/useIncome';
import { useFilingPack } from '@/hooks/useFilingPack';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNaira } from '@/lib/format';
import { Plus, Calculator, FileText, Wallet, TrendingUp, Receipt, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { data: computation } = useComputation();
  const { data: income } = useIncome();
  const { data: filingPack } = useFilingPack();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your tax filing for the selected year</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Income" value={formatNaira(computation?.totalIncome || 0)} icon={Wallet} />
        <StatCard title="Taxable Income" value={formatNaira(computation?.taxableIncome || 0)} icon={TrendingUp} />
        <StatCard title="Tax Owed" value={formatNaira(computation?.taxOwed || 0)} icon={Receipt} variant="highlight" />
        <StatCard title="Filing Status" value={filingPack?.status || 'Not Started'} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/app/income">
          <Button variant="outline" className="w-full justify-start h-auto py-4">
            <Plus className="h-5 w-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-medium">Add Income</p>
              <p className="text-xs text-muted-foreground">{income?.length || 0} records</p>
            </div>
          </Button>
        </Link>
        <Link to="/app/compute">
          <Button variant="outline" className="w-full justify-start h-auto py-4">
            <Calculator className="h-5 w-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-medium">Compute Tax</p>
              <p className="text-xs text-muted-foreground">Run calculation</p>
            </div>
          </Button>
        </Link>
        <Link to="/app/filing-pack">
          <Button variant="outline" className="w-full justify-start h-auto py-4">
            <FileText className="h-5 w-5 mr-3 shrink-0" />
            <div className="text-left">
              <p className="font-medium">Filing Pack</p>
              <p className="text-xs text-muted-foreground">Generate & download</p>
            </div>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {income && income.length > 0 ? (
            <div className="space-y-3">
              {income
                .slice(-5)
                .reverse()
                .map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{record.type} Income</p>
                      <p className="text-xs text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="font-medium">{formatNaira(record.amount)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activity yet. Start by adding income records.</p>
              <Link to="/app/income">
                <Button variant="link" className="mt-2">
                  Add Income <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
