// pages/_app.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import type { AppProps } from "next/app";
import "@/styles/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [supabase] = useState(() => createPagesBrowserClient());
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, _session) => {
      // Only redirect on explicit sign-in events (PASSWORD_RECOVERY, USER_UPDATED after sign-in)
      // Don't redirect on INITIAL_SESSION or TOKEN_REFRESHED
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
      // Remove auto-redirect on SIGNED_IN to prevent tab-switch redirects
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
