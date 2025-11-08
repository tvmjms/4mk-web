import { useEffect, useState } from 'react';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from 'next/link';

export default function Callback() {
  const supabase = useSupabaseClient();
  const [status, setStatus] = useState('Finishing sign-in...');

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setStatus('Error: ' + error.message);
        return;
      }
      if (!data.session) await supabase.auth.refreshSession();
      setStatus('Signed in! 🎉 Redirecting…');
      setTimeout(() => (window.location.href = '/dashboard'), 600);
    })();
  }, [supabase]);

  return (
    <main style={{ padding: 24 }}>
      <p>{status}</p>
      <p><Link href="/dashboard">Go to dashboard</Link></p>
    </main>
  );
}
