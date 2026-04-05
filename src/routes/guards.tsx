import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export function RequireCustomer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isCustomer, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isCustomer) {
    return <Navigate to="/admin" replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to={isStaff ? '/admin' : '/'} replace />;
  }
  return <>{children}</>;
}
