import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export default function NavBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  
  // Memoize login link to prevent unnecessary re-renders
  const loginWithRedirect = useMemo(() => {
    return `/login?next=${encodeURIComponent(router.asPath)}`;
  }, [router.asPath]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!ignore) setEmail(data.user?.email ?? null);
    }
    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);

  const onLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <nav className="mx-auto max-w-6xl px-4 h-12 flex items-center justify-between text-sm">
        <Link href="/" className="font-extrabold text-indigo-600">4MK</Link>

        <div className="flex items-center gap-6">
          <Link href="/needs" className="hover:underline">All Needs</Link>

          {email ? (
            <>
              <Link href="/dashboard" className="hover:underline">My Dashboard</Link>
              <span className="text-gray-500 hidden sm:inline">{email}</span>
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className={`rounded-md border px-3 py-1 hover:bg-gray-50 ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </button>
            </>
          ) : (
            <Link
              href={loginWithRedirect}
              className="rounded-md border px-3 py-1 hover:bg-gray-50"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
