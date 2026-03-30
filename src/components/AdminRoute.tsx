import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';

export function AdminRoute() {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/app/home" replace />;
  }

  return <Outlet />;
}
