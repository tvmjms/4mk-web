// hooks/useAuthGuard.ts
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from '@supabase/auth-helpers-react';

interface AuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
  timeout?: number;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { requireAuth = true, redirectTo = '/login', timeout = 100 } = options;
  const session = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Create redirect URL with current page as 'next' parameter
  const createRedirectUrl = useCallback((baseRedirectTo: string) => {
    const currentPath = router.asPath;
    // Don't redirect to login if already on login page
    if (currentPath.startsWith('/login') || currentPath.startsWith('/auth/')) {
      return baseRedirectTo;
    }
    return `${baseRedirectTo}?next=${encodeURIComponent(currentPath)}`;
  }, [router.asPath]);

  useEffect(() => {
    if (!requireAuth) {
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // If we have a session with user, authenticate immediately
    if (session?.user) {
      console.log('Auth Guard: Session found for user:', session.user.id);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // If session is null (not undefined), redirect immediately
    if (session === null) {
      const redirectUrl = createRedirectUrl(redirectTo);
      console.log('Auth Guard: No session, redirecting to:', redirectUrl);
      router.replace(redirectUrl);
      return;
    }

    // Session is undefined (still loading), wait briefly before giving up
    const timeoutId = setTimeout(() => {
      if (session === null || !session?.user) {
        const redirectUrl = createRedirectUrl(redirectTo);
        console.log('Auth Guard: Timeout - redirecting to:', redirectUrl);
        router.replace(redirectUrl);
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [session, router, requireAuth, redirectTo, timeout, createRedirectUrl]);

  return {
    isLoading,
    isAuthenticated,
    user: session?.user || null,
    session
  };
}
