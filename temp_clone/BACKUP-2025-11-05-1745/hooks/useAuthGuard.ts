// hooks/useAuthGuard.ts
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';

interface AuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  timeout?: number;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireAuth = true, redirectTo = '/login', timeout = 500 } = options;
  const session = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!requireAuth) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (session === null) {
        console.log('Auth Guard: No session found, redirecting to:', redirectTo);
        router.replace(redirectTo);
      } else if (session?.user) {
        console.log('Auth Guard: Session found for user:', session.user.id);
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    }, timeout);

    if (session?.user) {
      clearTimeout(timeoutId);
      console.log('Auth Guard: Immediate session found for user:', session.user.id);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (session === null) {
      clearTimeout(timeoutId);
      console.log('Auth Guard: Immediate null session, redirecting to:', redirectTo);
      router.replace(redirectTo);
    }

    return () => clearTimeout(timeoutId);
  }, [session, router, requireAuth, redirectTo, timeout]);

  return {
    isLoading,
    isAuthenticated,
    user: session?.user || null,
    session
  };
}
