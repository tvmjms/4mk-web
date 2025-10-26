import Head from "next/head";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

type Need = {
  id: number;
  title: string;
  created_at: string;
  city: string | null;
  state: string | null;
  category: string | null;
};

export default function DashboardPage() {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [mine, setMine] = useState<Need[]>([]);
  const [accepted, setAccepted] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const { data: myNeeds, error: e1 } = await supabase
          .from("needs")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        if (e1) throw e1;

        // accepted via fulfillment table
        const { data: f, error: e2 } = await supabase
          .from("fulfillment")
          .select("need_id, status")
          .eq("helper_id", user.id)
          .in("status", ["accepted", "fulfilled"])
          .order("created_at", { ascending: false });
        if (e2) throw e2;

        let acceptedNeeds: Need[] = [];
        if (f && f.length) {
          const ids = [...new Set(f.map((x: any) => x.need_id))];
          const { data: needsRows, error: e3 } = await supabase
            .from("needs")
            .select("*")
            .in("id", ids);
          if (e3) throw e3;
          acceptedNeeds = (needsRows || []) as any;
        }

        if (!ignore) {
          setMine((myNeeds || []) as any);
          setAccepted(acceptedNeeds);
        }
      } catch (e: any) {
        if (!ignore) setErr(e?.message ?? "Failed to load dashboard");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [user, supabase]);

  return (
    <>
      <Head><title>My Dashboard — 4MK</title></Head>
      <div className="min-h-screen bg-[#373737] py-8 px-3">
        <div className="mx-auto max-w-6xl rounded-[28px] bg-gradient-to-b from-pink-200 to-pink-300 p-6 md:p-10 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ring-2 ring-[#E3B341]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-neutral-900">My Dashboard</h1>
            <a href="/" className="text-sm underline text-neutral-800">← Back to Home</a>
          </div>

          {loading && <div className="mt-6 text-neutral-800">Loading…</div>}
          {err && <div className="mt-6 text-red-700">Error: {err}</div>}

          {!loading && !err && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Posted Needs */}
              <div className="rounded-2xl bg-[#6d5d5c]/80 p-3 md:p-4 shadow-xl">
                <div className="rounded-2xl bg-white/70 p-3 shadow">
                  <div className="mb-2 text-lg font-semibold text-neutral-900">My Posted Needs</div>
                  <div className="space-y-2">
                    {mine.length === 0 && <div className="text-sm text-neutral-700">No needs posted yet.</div>}
                    {mine.map((n) => (
                      <a key={n.id} href={`/needs/${n.id}`} className="block rounded-xl bg-white shadow border border-neutral-300 px-3 py-2 hover:border-neutral-400">
                        <div className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString()}</div>
                        <div className="text-sm font-semibold text-neutral-900">{n.title}</div>
                        <div className="text-xs text-neutral-700">{n.city ?? ""}{n.state ? `, ${n.state}` : ""} • {n.category ?? "other"}</div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Offers I Accepted */}
              <div className="rounded-2xl bg-[#6d5d5c]/80 p-3 md:p-4 shadow-xl">
                <div className="rounded-2xl bg-white/70 p-3 shadow">
                  <div className="mb-2 text-lg font-semibold text-neutral-900">Offers I Accepted</div>
                  <div className="space-y-2">
                    {accepted.length === 0 && <div className="text-sm text-neutral-700">No accepted offers yet.</div>}
                    {accepted.map((n) => (
                      <a key={n.id} href={`/needs/${n.id}`} className="block rounded-xl bg-white shadow border border-neutral-300 px-3 py-2 hover:border-neutral-400">
                        <div className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString()}</div>
                        <div className="text-sm font-semibold text-neutral-900">{n.title}</div>
                        <div className="text-xs text-neutral-700">{n.city ?? ""}{n.state ? `, ${n.state}` : ""} • {n.category ?? "other"}</div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
