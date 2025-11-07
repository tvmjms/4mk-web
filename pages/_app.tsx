import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import Header from "@/components/Header";

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createPagesBrowserClient());
  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <Header />
      <Component {...pageProps} />
    </SessionContextProvider>
  );
}
