import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted && data.user) {
        const next = (router.query.next as string) || "/dashboard";
        router.replace(next);
      }
    })();
    return () => { mounted = false; };
  }, [router, supabase]);

  async function doLogin() {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setMsg(error.message);
    else router.replace((router.query.next as string) || "/dashboard");
  }

  async function sendMagic() {
    setLoading(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setLoading(false);
    setMsg(error ? error.message : "Check your email for a login link.");
  }

  return (
    <>
      <Head><title>Login — 4MK</title></Head>
      <div className="min-h-screen bg-[#373737] py-8 px-3">
        <div className="mx-auto max-w-2xl rounded-[28px] bg-gradient-to-b from-pink-200 to-pink-300 p-6 md:p-10 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ring-2 ring-[#E3B341]">
          <h1 className="text-3xl font-extrabold text-neutral-900">Login</h1>
          <p className="text-neutral-700 mt-1">Welcome back.</p>

          <div className="mt-6 space-y-3">
            <input
              type="email"
              className="w-full rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={doLogin}
                disabled={loading}
                className="rounded-full bg-emerald-700 text-white px-5 py-2 shadow hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Logging in…" : "Login"}
              </button>
              <button
                onClick={sendMagic}
                disabled={loading || !email}
                className="rounded-full bg-neutral-900 text-white px-5 py-2 shadow hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </div>
            {msg && <div className="text-sm text-red-700">{msg}</div>}
            <a href="/forgot" className="text-sm text-blue-700 underline">Forgot password?</a>
          </div>
        </div>
      </div>
    </>
  );
}
