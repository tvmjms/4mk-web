import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from 'next/link';

export default function Callback() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [status, setStatus] = useState('Finishing sign-in...');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('Error: ' + error.message);
        return;
      }
      if (!data.session) await supabase.auth.refreshSession();
      
      // Get redirect destination from URL params
      const redirectTo = router.query.next as string || '/dashboard';
      
      setStatus('Signed in! 🎉 Redirecting…');
      setTimeout(() => {
        router.push(redirectTo);
      }, 600);
    })();
  }, [supabase, router]);

  const redirectTo = router.query.next as string || '/dashboard';

  return (
    <main style={{ padding: 24 }}>
      <p>{status}</p>
      <p><Link href={redirectTo}>Continue to your destination</Link></p>
    </main>
  );
}
