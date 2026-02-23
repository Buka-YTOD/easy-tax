import { NavLink } from 'react-router-dom';
import { Home, Sparkles, ClipboardCheck, BarChart3, FileText, Wrench, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { title: 'Home', path: '/app/home', icon: Home },
  { title: 'Guided Interview', path: '/app/guided', icon: Sparkles },
  { title: 'Review', path: '/app/review', icon: ClipboardCheck },
  { title: 'Result', path: '/app/result', icon: BarChart3 },
  { title: 'Filing Pack', path: '/app/filing-pack', icon: FileText },
  { title: 'Manual Mode', path: '/app/manual', icon: Wrench },
  { title: 'Settings', path: '/app/settings', icon: Settings },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
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
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50">Nigerian Tax Act 2026</p>
        </div>
      </aside>
    </>
  );
}
