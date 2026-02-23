import type { SuggestedAction } from '@/types/guided';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, AlertCircle } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ProposedActionsListProps {
  actions: SuggestedAction[];
  onConfirm: (action: SuggestedAction) => void;
  confirmedIds: Set<string>;
  isConfirming?: boolean;
}

function actionLabel(action: SuggestedAction): string {
  const p = action.payload;
  switch (action.type) {
    case 'create_income':
      return `Add ${p.type || 'Income'}: ${p.amount ? formatNaira(p.amount as number) : ''} ${p.frequency || ''}`.trim();
    case 'create_capital_gain':
      return `Add Capital Gain: ${p.assetType || 'Asset'}`;
    case 'create_deduction':
      return `Add Deduction: ${p.type || 'Deduction'} ${p.amount ? formatNaira(p.amount as number) : ''}`.trim();
    case 'update_profile':
      return `Update Profile: ${Object.entries(p).map(([k, v]) => `${k}=${v}`).join(', ')}`;
    case 'compute_tax':
      return 'Compute Tax';
    case 'generate_filing_pack':
      return 'Generate Filing Pack';
    default:
      return action.type;
  }
}

function actionKey(action: SuggestedAction, i: number) {
  return `${action.type}_${i}`;
}

export function ProposedActionsList({ actions, onConfirm, confirmedIds, isConfirming }: ProposedActionsListProps) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proposed Changes</p>
      {actions.map((action, i) => {
        const key = actionKey(action, i);
        const done = confirmedIds.has(key);

        return (
          <Card key={key} className={cn('border', done && 'border-primary/30 bg-accent/50')}>
            <CardContent className="p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm min-w-0">
                {done ? (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{actionLabel(action)}</span>
                {action.confidence < 0.7 && (
                  <span className="text-xs text-muted-foreground">(low confidence)</span>
                )}
              </div>
              {!done && (
                <Button size="sm" variant="default" onClick={() => onConfirm(action)} disabled={isConfirming}>
                  Confirm
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export { actionKey };
