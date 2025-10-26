import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // When user visits from the email link, they are already authenticated temporarily.
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) setErr(error.message);
      if (!data.session) {
        setErr('Reset link is invalid or expired. Please request another.');
      }
    })();
  }, []);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else {
      setMsg('Password updated. Redirecting to dashboard…');
      setTimeout(() => (window.location.href = '/dashboard'), 800);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Set a new password</h1>
      <form onSubmit={updatePassword}>
        <input
          type="password"
          placeholder="new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button type="submit" disabled={!password}>Update password</button>
      </form>
      {msg && <p style={{ color: 'green' }}>{msg}</p>}
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
    </main>
  );
}
