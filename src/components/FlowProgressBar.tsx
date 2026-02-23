import { useLocation, Link } from 'react-router-dom';
import { useTaxProfile } from '@/hooks/useTaxProfile';
import { useIncome } from '@/hooks/useIncome';
import { useComputation } from '@/hooks/useComputation';
import { useFilingPack } from '@/hooks/useFilingPack';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Profile', path: '/app/settings' },
  { label: 'Income', path: '/app/guided' },
  { label: 'Review', path: '/app/review' },
  { label: 'Compute', path: '/app/result' },
  { label: 'Filing Pack', path: '/app/filing-pack' },
];

export function FlowProgressBar() {
  const location = useLocation();
  const { data: profile } = useTaxProfile();
  const { data: income = [] } = useIncome();
  const { data: computation } = useComputation();
  const { data: filingPack } = useFilingPack();

  const completionStatus = [
    !!profile?.stateOfResidence,
    income.length > 0,
    income.length > 0, // review is "done" once income exists
    !!computation,
    !!filingPack,
  ];

  const currentPath = location.pathname;

  return (
    <div className="hidden md:flex items-center justify-center gap-0 py-3 px-4 border-b bg-card/50">
      {STEPS.map((step, i) => {
        const isComplete = completionStatus[i];
        const isActive = currentPath === step.path ||
          (step.path === '/app/guided' && currentPath === '/app/home') ||
          (step.path === '/app/guided' && currentPath.startsWith('/app/manual'));

        return (
          <div key={step.label} className="flex items-center">
            <Link
              to={step.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                isActive && 'bg-primary text-primary-foreground',
                isComplete && !isActive && 'text-primary',
                !isComplete && !isActive && 'text-muted-foreground'
              )}
            >
              {isComplete && !isActive && <Check className="h-3 w-3" />}
              <span>{step.label}</span>
            </Link>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-6 h-px mx-1',
                completionStatus[i] ? 'bg-primary' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
