import { Link } from 'react-router-dom';
import { useComputation } from '@/hooks/useComputation';
import { useIncome } from '@/hooks/useIncome';
import { useFilingPack } from '@/hooks/useFilingPack';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Wrench, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Home() {
  const { data: computation } = useComputation();
  const { data: income = [] } = useIncome();
  const { data: filingPack } = useFilingPack();
  const isComplete = !!filingPack;
  const hasProgress = !isComplete && (income.length > 0 || !!computation);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome to TaxWise 🇳🇬</h1>
        <p className="text-muted-foreground text-lg">Let's get your taxes sorted — the easy way.</p>
      </div>

      {isComplete && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">Your tax return is ready!</p>
                <p className="text-sm text-muted-foreground">Filing pack generated for this year.</p>
              </div>
            </div>
            <Link to="/app/filing-pack">
              <Button size="sm" variant="outline">
                View Filing Pack <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {hasProgress && (
        <Card className="border-primary/20 bg-accent/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Continue where you left off</p>
              <p className="text-sm text-muted-foreground">{income.length} income record{income.length !== 1 ? 's' : ''} captured</p>
            </div>
            <Link to="/app/guided">
              <Button size="sm">
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Link to="/app/guided">
          <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Guided Mode</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  I'll ask you simple questions and handle everything. Perfect if you're not sure where to start.
                </p>
                <p className="text-xs text-primary font-medium mt-3 flex items-center gap-1">
                  Recommended <Bot className="h-3 w-3" />
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/manual">
          <Card className="group hover:border-border transition-colors cursor-pointer">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-muted">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">Manual Mode</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  I already know what to enter. Give me the forms and tables.
                </p>
                <p className="text-xs text-muted-foreground mt-3">Advanced</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mt-1" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
