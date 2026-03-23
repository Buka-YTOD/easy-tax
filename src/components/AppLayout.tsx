import { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useSubscription } from '@/hooks/useSubscription';
import { trackPageView, track } from '@/lib/mixpanel';
import { AppSidebar } from '@/components/AppSidebar';
import { Menu, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppLayout() {
  const { isAuthenticated, isLoading, profile, logout, user } = useAppContext();
  const { isActive: subscriptionActive, loading: subLoading } = useSubscription();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track page views on route change
  useEffect(() => {
    const pageName = location.pathname.replace('/app/', '').replace('/', ' › ') || 'home';
    trackPageView(pageName);
  }, [location.pathname]);

  // Track outbound link clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href], button');
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'a') {
        const href = (target as HTMLAnchorElement).href;
        if (href && !href.startsWith(window.location.origin)) {
          track('Outbound Link Clicked', { url: href });
        }
      }
      if (tag === 'button') {
        const text = (target as HTMLElement).textContent?.trim().slice(0, 50);
        if (text) track('Button Clicked', { label: text, page: location.pathname });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [location.pathname]);

  if (isLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!subscriptionActive) return <Navigate to="/payment" replace />;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary">
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {profile?.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
