import { NavLink } from 'react-router-dom';
import { Home, Sparkles, ClipboardCheck, BarChart3, FileText, Wrench, Settings, X, Check, Upload, Lightbulb, TrendingUp, CalendarDays, FolderOpen, ShieldCheck, Calculator, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTaxProfile } from '@/hooks/useTaxProfile';
import { useIncome } from '@/hooks/useIncome';
import { useComputation } from '@/hooks/useComputation';
import { useFilingPack } from '@/hooks/useFilingPack';
import { useIsAdmin } from '@/hooks/useAdmin';

const navGroups = [
  {
    label: 'GET STARTED',
    items: [
      { title: 'Home', path: '/app/home', icon: Home, completionKey: null },
      { title: 'Guided Interview', path: '/app/guided', icon: Sparkles, completionKey: 'income' },
    ],
  },
  {
    label: 'YOUR DATA',
    items: [
      { title: 'Review', path: '/app/review', icon: ClipboardCheck, completionKey: null },
      { title: 'Result', path: '/app/result', icon: BarChart3, completionKey: 'computation' },
      { title: 'Filing Pack', path: '/app/filing-pack', icon: FileText, completionKey: 'filingPack' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { title: 'Tax Calculator', path: '/app/tax-calculator', icon: Calculator, completionKey: null },
      { title: 'Import CSV', path: '/app/import', icon: Upload, completionKey: null },
      { title: 'Tax Optimizer', path: '/app/optimizer', icon: Lightbulb, completionKey: null },
      { title: 'Year Comparison', path: '/app/comparison', icon: TrendingUp, completionKey: null },
      { title: 'Tax Calendar', path: '/app/calendar', icon: CalendarDays, completionKey: null },
      { title: 'Documents', path: '/app/documents', icon: FolderOpen, completionKey: null },
    ],
  },
  {
    label: 'ADVANCED',
    items: [
      { title: 'Manual Mode', path: '/app/manual', icon: Wrench, completionKey: null },
      { title: 'Settings', path: '/app/settings', icon: Settings, completionKey: 'profile' },
    ],
  },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { data: profile } = useTaxProfile();
  const { data: income = [] } = useIncome();
  const { data: computation } = useComputation();
  const { data: filingPack } = useFilingPack();
  const { data: isAdmin } = useIsAdmin();

  const completionMap: Record<string, boolean> = {
    profile: !!profile?.stateOfResidence,
    income: income.length > 0,
    computation: !!computation,
    filingPack: !!filingPack,
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <span className="font-bold text-lg tracking-tight text-sidebar-primary">TaxWise</span>
          <Button variant="ghost" size="icon" className="lg:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex-1 py-2 px-3 overflow-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isComplete = item.completionKey ? completionMap[item.completionKey] : false;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.title}</span>
                      {isComplete && (
                        <Check className="h-3.5 w-3.5 text-sidebar-primary shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
          {isAdmin && (
            <div className="mb-3">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                ADMIN
              </p>
              <NavLink
                to="/app/admin"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )
                }
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Admin Dashboard</span>
              </NavLink>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">Nigerian Tax Act 2026</p>
        </div>
      </aside>
    </>
  );
}
