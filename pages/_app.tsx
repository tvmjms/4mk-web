import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useState } from "react";
import {
  SessionContextProvider,
  createPagesBrowserClient,
} from "@supabase/auth-helpers-nextjs";
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
