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
  const { requireAuth = true, redirectTo = '/login', timeout = 50 } = options;
  const session = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

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

    // Prevent multiple redirects
    if (hasRedirected) {
      return;
    }

    // If we have a session with user, authenticate immediately
    if (session?.user) {
      console.log('Auth Guard: Session found for user:', session.user.id);
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }

    // If session is explicitly null (not undefined/loading), redirect immediately
    if (session === null) {
      const redirectUrl = createRedirectUrl(redirectTo);
      console.log('Auth Guard: No session, redirecting to:', redirectUrl);
      setHasRedirected(true);
      setIsLoading(false);
      router.replace(redirectUrl);
      return;
    }

    // Session is undefined (still loading from Supabase)
    // Wait briefly in case session loads quickly
    const timeoutId = setTimeout(() => {
      if (session === null || !session?.user) {
        const redirectUrl = createRedirectUrl(redirectTo);
        console.log('Auth Guard: Timeout - no session, redirecting to:', redirectUrl);
        setHasRedirected(true);
        setIsLoading(false);
        router.replace(redirectUrl);
      }
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [session, router, requireAuth, redirectTo, timeout, createRedirectUrl, hasRedirected]);

  return {
    isLoading,
    isAuthenticated,
    user: session?.user || null,
    session
  };
}
