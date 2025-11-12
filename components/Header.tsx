// components/Header.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMemo, useCallback, useState, useEffect } from "react";

export default function Header() {
  const session = useSession();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [email, setEmail] = useState<string | null>(session?.user?.email ?? null);
  
  // Memoize login link to prevent unnecessary re-renders
  const loginWithRedirect = useMemo(() => {
    return `/login?next=${encodeURIComponent(router.asPath)}`;
  }, [router.asPath]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    setEmail(session?.user?.email ?? null);
  }, [session]);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (isMounted) {
        setEmail(data.user?.email ?? null);
      }
    };

    loadSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setEmail(newSession?.user?.email ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="bg-turquoise-400 px-4 py-1 header-double-gold relative">
      <div className="mx-auto max-w-6xl flex justify-between items-center">
        <Link href="/" className="text-lg font-extrabold text-white tracking-tight">
          4MK
        </Link>
        
        <nav className="flex items-center space-x-4 text-xs">
          <Link href="https://facebook.com" className="text-white hover:text-white/80 font-semibold">
            Facebook
          </Link>
          <Link href="/about" className="text-white hover:text-white/80 font-semibold">
            How It Works
          </Link>
          <Link href="/contact" className="text-white hover:text-white/80 font-semibold">
            Contact Us
          </Link>
          <Link href="/dashboard" className="text-white hover:text-white/80 font-semibold">
            Dashboard
          </Link>
          {email ? (
            <>
              <button 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className={`text-white hover:text-white/80 font-semibold ${
                  isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
              <span className="text-white/90 text-[10px] font-medium">{email}</span>
            </>
          ) : (
            <Link href={loginWithRedirect} className="text-white hover:text-white/80 font-semibold">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
