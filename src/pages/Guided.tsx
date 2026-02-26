import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useGuidedInterview } from '@/hooks/useGuidedInterview';
import { useAddIncome } from '@/hooks/useIncome';
import { useAddCapitalGain } from '@/hooks/useCapitalGains';
import { useAddDeduction } from '@/hooks/useDeductions';
import { useUpdateTaxProfile } from '@/hooks/useTaxProfile';
import { useAddBenefitInKind } from '@/hooks/useBenefitsInKind';
import { useAddAssetDeclaration } from '@/hooks/useAssetDeclarations';
import { useAddCapitalAllowance } from '@/hooks/useCapitalAllowances';
import { useToast } from '@/hooks/use-toast';
import { ChatPanel } from '@/components/ChatPanel';
import { StepperProgress } from '@/components/StepperProgress';
import { SummaryPanel } from '@/components/SummaryPanel';
import { Button } from '@/components/ui/button';
import type { SuggestedAction } from '@/types/guided';
import { actionKey } from '@/components/ProposedActionsList';
import { RotateCcw, Wrench, ArrowRight } from 'lucide-react';

export default function Guided() {
  const confirmRef = useRef<(action: SuggestedAction) => void>();
  const handleAutoConfirm = useCallback((actions: SuggestedAction[]) => {
    actions.forEach(a => confirmRef.current?.(a));
  }, []);
  const { messages, stage, isLoading, sendMessage, startInterview, resetSession } = useGuidedInterview(handleAutoConfirm);
  const addIncome = useAddIncome();
  const addGain = useAddCapitalGain();
  const addDeduction = useAddDeduction();
  const updateProfile = useUpdateTaxProfile();
  const addBik = useAddBenefitInKind();
  const addAsset = useAddAssetDeclaration();
  const addAllowance = useAddCapitalAllowance();
  const { toast } = useToast();
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmAction = useCallback(async (action: SuggestedAction) => {
    setIsConfirming(true);
    try {
      const p = action.payload as Record<string, any>;
      switch (action.type) {
        case 'create_income':
          await addIncome.mutateAsync({
            type: p.type || 'Other',
            amount: p.amount || 0,
            frequency: p.frequency || 'OneOff',
            metadataJson: p.metadataJson || '',
          });
          toast({ title: '✅ Income record added!' });
          break;
        case 'create_capital_gain':
          await addGain.mutateAsync({
            assetType: p.assetType || 'Other',
            proceeds: p.proceeds || 0,
            costBasis: p.costBasis || 0,
            fees: p.fees || 0,
            realizedAt: p.realizedAt || new Date().toISOString(),
          });
          toast({ title: '✅ Capital gain added!' });
          break;
        case 'create_deduction':
          await addDeduction.mutateAsync({
            type: p.type || 'Other',
            amount: p.amount || 0,
            description: p.description || '',
          });
          toast({ title: '✅ Deduction added!' });
          break;
        case 'create_benefit_in_kind':
          await addBik.mutateAsync({
            category: p.category || 'Other',
            annualValue: p.annualValue || 0,
            description: p.description || null,
          });
          toast({ title: '✅ Benefit in kind added!' });
          break;
        case 'create_asset_declaration':
          await addAsset.mutateAsync({
            assetType: p.assetType || 'Other',
            description: p.description || null,
            location: p.location || '',
            dateAcquired: p.dateAcquired || null,
            cost: p.cost || 0,
            currentValue: p.currentValue || 0,
          });
          toast({ title: '✅ Asset declaration added!' });
          break;
        case 'create_capital_allowance':
          await addAllowance.mutateAsync({
            assetDescription: p.assetDescription || '',
            cost: p.cost || 0,
            ratePercent: p.ratePercent || 0,
            allowanceAmount: p.allowanceAmount || 0,
            yearAcquired: p.yearAcquired || null,
          });
          toast({ title: '✅ Capital allowance added!' });
          break;
        case 'update_profile':
          await updateProfile.mutateAsync(p);
          toast({ title: '✅ Profile updated!' });
          break;
        default:
          toast({ title: 'Action noted' });
      }

      // Find and mark confirmed
      const msgWithAction = messages.find((m) =>
        m.suggestedActions?.some((a) => a.type === action.type)
      );
      if (msgWithAction) {
        const idx = msgWithAction.suggestedActions!.indexOf(action);
        setConfirmedIds((prev) => new Set(prev).add(actionKey(action, idx)));
      }
    } catch {
      toast({ title: 'Failed to apply action', variant: 'destructive' });
    }
    setIsConfirming(false);
  }, [addIncome, addGain, addDeduction, updateProfile, addBik, addAsset, addAllowance, toast, messages]);

  confirmRef.current = handleConfirmAction;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row gap-4 -m-4 md:-m-6">
      {/* Left: Progress (desktop) */}
      <div className="hidden lg:flex flex-col w-56 border-r bg-card p-4 shrink-0">
        <h2 className="font-semibold text-sm text-foreground mb-4">Progress</h2>
        <StepperProgress currentStage={stage} className="flex-1" />
        <div className="space-y-2 pt-4 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={resetSession}>
            <RotateCcw className="h-3 w-3 mr-2" /> Start Over
          </Button>
          <Link to="/app/manual">
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
              <Wrench className="h-3 w-3 mr-2" /> Switch to Manual
            </Button>
          </Link>
        </div>
      </div>

      {/* Center: Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile progress bar */}
        <div className="lg:hidden flex items-center gap-2 px-4 py-2 border-b bg-card overflow-x-auto">
          <StepperProgress currentStage={stage} className="flex flex-row gap-1 !space-y-0" />
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-sm">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-3xl">🤖</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Ready to file your taxes?</h2>
              <p className="text-muted-foreground text-sm">
                I'll walk you through it step by step. No tax knowledge needed — just answer my questions.
              </p>
              <Button size="lg" onClick={startInterview} className="mt-4">
                Let's Go <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            stage={stage}
            onSend={sendMessage}
            onConfirmAction={handleConfirmAction}
            confirmedActionIds={confirmedIds}
            isConfirming={isConfirming}
          />
        )}
      </div>

      {/* Right: Summary (desktop) */}
      <div className="hidden lg:block w-56 p-4 shrink-0 border-l bg-card">
        <SummaryPanel />

        {stage === 'review' && (
          <Link to="/app/review" className="block mt-4">
            <Button size="sm" className="w-full">
              Go to Review <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
