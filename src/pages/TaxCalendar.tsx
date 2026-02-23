import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, Check } from 'lucide-react';

interface TaxDeadline {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date
  category: 'PAYE' | 'Annual' | 'CGT' | 'VAT' | 'WHT';
  recurring: 'monthly' | 'annual' | 'quarterly';
}

const TAX_DEADLINES: TaxDeadline[] = [
  {
    id: 'paye-monthly',
    title: 'PAYE Monthly Remittance',
    description: 'Pay As You Earn tax must be remitted to the relevant tax authority by the 10th of each month for the preceding month.',
    date: '2026-03-10',
    category: 'PAYE',
    recurring: 'monthly',
  },
  {
    id: 'annual-return-individual',
    title: 'Annual Tax Return (Individual)',
    description: 'Individual taxpayers must file their annual tax return with the FIRS or relevant state IRS by March 31st of the following year.',
    date: '2026-03-31',
    category: 'Annual',
    recurring: 'annual',
  },
  {
    id: 'annual-return-business',
    title: 'Annual Tax Return (Business)',
    description: 'Companies must file annual returns within 6 months of their financial year end. For calendar year companies, this is June 30th.',
    date: '2026-06-30',
    category: 'Annual',
    recurring: 'annual',
  },
  {
    id: 'cgt-return',
    title: 'Capital Gains Tax Filing',
    description: 'Capital gains tax returns must be filed alongside your annual return. CGT is charged at 10% on gains from disposal of chargeable assets.',
    date: '2026-03-31',
    category: 'CGT',
    recurring: 'annual',
  },
  {
    id: 'vat-monthly',
    title: 'VAT Monthly Return',
    description: 'Value Added Tax returns must be filed and remitted by the 21st of the month following the month of the transaction.',
    date: '2026-03-21',
    category: 'VAT',
    recurring: 'monthly',
  },
  {
    id: 'wht-remittance',
    title: 'Withholding Tax Remittance',
    description: 'WHT deducted must be remitted to the FIRS within 21 days from the date of deduction, along with a schedule of payments.',
    date: '2026-03-21',
    category: 'WHT',
    recurring: 'monthly',
  },
  {
    id: 'paye-annual',
    title: 'PAYE Annual Filing (Form H1)',
    description: 'Employers must file Form H1 (annual PAYE declaration) with the relevant tax authority by January 31st.',
    date: '2027-01-31',
    category: 'PAYE',
    recurring: 'annual',
  },
];

const CATEGORY_STYLES: Record<string, string> = {
  PAYE: 'default',
  Annual: 'secondary',
  CGT: 'outline',
  VAT: 'default',
  WHT: 'secondary',
};

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadlineDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function TaxCalendar() {
  const sortedDeadlines = useMemo(() => {
    return [...TAX_DEADLINES].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const upcomingCount = sortedDeadlines.filter(d => getDaysUntil(d.date) > 0 && getDaysUntil(d.date) <= 30).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Calendar</h1>
        <p className="text-muted-foreground">Nigerian tax deadlines and reminders</p>
      </div>

      {upcomingCount > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium">{upcomingCount} deadline{upcomingCount > 1 ? 's' : ''} within 30 days</p>
              <p className="text-sm text-muted-foreground">Review the deadlines below and prepare your filings.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sortedDeadlines.map((deadline) => {
          const daysUntil = getDaysUntil(deadline.date);
          const isPast = daysUntil < 0;
          const isUrgent = daysUntil >= 0 && daysUntil <= 14;
          const isSoon = daysUntil > 14 && daysUntil <= 30;

          return (
            <Card key={deadline.id} className={isUrgent ? 'border-destructive/30' : isSoon ? 'border-primary/20' : ''}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isPast ? 'bg-muted' : isUrgent ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    {isPast ? (
                      <Check className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <CalendarDays className={`h-5 w-5 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium ${isPast ? 'text-muted-foreground' : ''}`}>{deadline.title}</h3>
                      <Badge variant={CATEGORY_STYLES[deadline.category] as any} className="text-[10px]">
                        {deadline.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{deadline.recurring}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{deadline.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {formatDeadlineDate(deadline.date)}
                      </span>
                      <span className={`flex items-center gap-1 font-medium ${
                        isPast ? 'text-muted-foreground' : isUrgent ? 'text-destructive' : isSoon ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {isPast ? 'Past due' : daysUntil === 0 ? 'Today!' : `${daysUntil} days left`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
