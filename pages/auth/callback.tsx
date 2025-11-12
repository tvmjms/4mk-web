import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from 'next/link';

export default function Callback() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [status, setStatus] = useState('Finishing sign-in...');
  const [redirectTarget, setRedirectTarget] = useState('/dashboard');

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const nextParam = router.query.next as string | undefined;
    if (nextParam) {
      setRedirectTarget(nextParam);
      return;
    }
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('postAuthRedirect');
      if (stored) {
        window.localStorage.removeItem('postAuthRedirect');
        setRedirectTarget(stored);
      }
    }
  }, [router.isReady, router.query.next]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('Error: ' + error.message);
        return;
      }
      if (!data.session) await supabase.auth.refreshSession();
      
      const destination = redirectTarget || '/dashboard';
      setStatus('Signed in! 🎉 Redirecting…');
      setTimeout(() => {
        router.push(destination);
      }, 600);
    })();
  }, [supabase, router, redirectTarget]);

  const redirectTo = redirectTarget || '/dashboard';

  return (
    <main style={{ padding: 24 }}>
      <p>{status}</p>
      <p><Link href={redirectTo}>Continue to your destination</Link></p>
    </main>
  );
}
