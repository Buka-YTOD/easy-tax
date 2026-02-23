import { NavLink } from 'react-router-dom';
import { Home, Sparkles, ClipboardCheck, BarChart3, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FileText, Wrench, Settings } from 'lucide-react';

const mainItems = [
  { title: 'Home', path: '/app/home', icon: Home },
  { title: 'Guided', path: '/app/guided', icon: Sparkles },
  { title: 'Review', path: '/app/review', icon: ClipboardCheck },
  { title: 'Result', path: '/app/result', icon: BarChart3 },
];

const moreItems = [
  { title: 'Filing Pack', path: '/app/filing-pack', icon: FileText },
  { title: 'Manual Mode', path: '/app/manual', icon: Wrench },
  { title: 'Settings', path: '/app/settings', icon: Settings },
];

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card flex items-center justify-around h-14 safe-bottom">
        {mainItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] transition-colors',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] text-muted-foreground"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 mt-4">
            {moreItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors',
                    isActive ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground hover:bg-muted'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
