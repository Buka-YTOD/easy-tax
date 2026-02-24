import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useSubscription } from '@/hooks/useSubscription';
import { AppSidebar } from '@/components/AppSidebar';
import { FlowProgressBar } from '@/components/FlowProgressBar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Menu, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AppLayout() {
  const { isAuthenticated, isLoading, profile, logout, selectedTaxYear, setSelectedTaxYear } = useAppContext();
  const { isActive: subscriptionActive, loading: subLoading } = useSubscription();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <Select value={String(selectedTaxYear)} onValueChange={(v) => setSelectedTaxYear(Number(v))}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    TY {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                {profile?.full_name
                  ?.split(' ')
                  .map((n: string) => n[0])
                  .join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <FlowProgressBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
