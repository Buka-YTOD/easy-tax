import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, Receipt, ArrowRight, Wrench } from 'lucide-react';

const sections = [
  { title: 'Income Records', desc: 'Add and manage your income sources', icon: Wallet, path: '/app/manual/income' },
  { title: 'Capital Gains', desc: 'Track asset sales and gains', icon: TrendingUp, path: '/app/manual/capital-gains' },
  { title: 'Deductions', desc: 'Manage your tax deductions', icon: Receipt, path: '/app/manual/deductions' },
];

export default function ManualHub() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Manual Mode</h1>
        </div>
        <p className="text-muted-foreground">Advanced — for users who know what to enter.</p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link key={s.path} to={s.path}>
            <Card className="group hover:border-primary/30 transition-colors cursor-pointer mb-3">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-muted">
                  <s.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link to="/app/guided">
          <Button variant="link">← Back to Guided Mode</Button>
        </Link>
      </div>
    </div>
  );
}
