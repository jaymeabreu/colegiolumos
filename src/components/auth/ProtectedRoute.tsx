
import { ReactNode, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = authService.getAuthState();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Evita redirecionamentos múltiplos
    if (hasRedirected.current) return;

    if (!isAuthenticated) {
      hasRedirected.current = true;
      navigate('/', { replace: true });
      return;
    }

    if (requiredRole && user && !authService.hasPermission(user.papel, requiredRole)) {
      hasRedirected.current = true;
      const redirectPath = authService.getRedirectPath(user.papel);
      navigate(redirectPath, { replace: true });
      return;
    }
  }, [isAuthenticated, user, requiredRole, navigate]);

  // Não renderiza nada durante redirecionamento
  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user && !authService.hasPermission(user.papel, requiredRole)) {
    return null;
  }

  return <>{children}</>;
}
