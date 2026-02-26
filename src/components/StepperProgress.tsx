import type { InterviewStage } from '@/types/guided';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS: { stage: InterviewStage; label: string }[] = [
  { stage: 'profile', label: 'Profile' },
  { stage: 'income', label: 'Income' },
  { stage: 'capital_gains', label: 'Capital Gains' },
  { stage: 'deductions', label: 'Deductions' },
  { stage: 'benefits_in_kind', label: 'Benefits in Kind' },
  { stage: 'asset_declarations', label: 'Assets' },
  { stage: 'capital_allowances', label: 'Allowances' },
  { stage: 'review', label: 'Review' },
  { stage: 'complete', label: 'Finish' },
];

const ORDER: Record<InterviewStage, number> = {
  profile: 0, income: 1, capital_gains: 2, deductions: 3, benefits_in_kind: 4, asset_declarations: 5, capital_allowances: 6, review: 7, complete: 8,
};

interface StepperProgressProps {
  currentStage: InterviewStage;
  className?: string;
}

export function StepperProgress({ currentStage, className }: StepperProgressProps) {
  const currentIndex = ORDER[currentStage];

  return (
    <div className={cn('space-y-1', className)}>
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div
            key={step.stage}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isCurrent && 'bg-accent text-accent-foreground font-medium',
              isDone && 'text-primary',
              !isDone && !isCurrent && 'text-muted-foreground'
            )}
          >
            {isDone ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <Circle className={cn('h-4 w-4 shrink-0', isCurrent && 'fill-primary text-primary')} />
            )}
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
