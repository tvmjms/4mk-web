// pages/_app.tsx
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [supabase] = useState(() => createPagesBrowserClient());
  const router = useRouter();
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      console.log('🔑 Auth state change:', event, 'on page:', router.asPath);
      
      // Clear any pending redirects
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
        redirectTimeout.current = null;
      }
      
      // Only redirect on explicit sign-out events with a small delay to prevent flicker
      if (event === "SIGNED_OUT" && 
          !router.asPath.startsWith('/login') && 
          !router.asPath.startsWith('/auth/') &&
          !router.asPath.startsWith('/register')) {
        console.log('🔄 Scheduling redirect to login after sign out');
        redirectTimeout.current = setTimeout(() => {
          router.push("/login");
        }, 100); // Small delay to prevent flicker
      }
    });

    return () => {
      subscription.unsubscribe();
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [supabase, router]);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SessionContextProvider
          supabaseClient={supabase}
          initialSession={pageProps.initialSession}
        >
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </SessionContextProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
