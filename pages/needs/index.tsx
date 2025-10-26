// /pages/needs/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import NeedFilters, { Range } from "@/components/NeedFilters";

type Need = Database["public"]["Tables"]["needs"]["Row"];
type Fulfillment = Database["public"]["Tables"]["fulfillment"]["Row"];

export default function AllNeedsPage() {
  const supabase = createPagesBrowserClient<Database>();

  // 🔧 NEW: keyword state for <NeedFilters>
  const [q, setQ] = useState("");

  // keep your time filter
  const [range, setRange] = useState<Range>("all");

  const [needs, setNeeds] = useState<Need[]>([]);
  const [fulfills, setFulfills] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: needsData, error: needsErr } = await supabase
        .from("needs")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      const { data: fData } = await supabase
        .from("fulfillment")
        .select("*");

      if (needsErr) setErr(needsErr.message);
      setNeeds(needsData || []);
      setFulfills(fData || []);
      setLoading(false);
    })();
  }, [supabase]);

  const statusFor = (needId: string) => {
    const f = fulfills.find((x) => x.need_id === needId);
    if (!f) return "Unfulfilled";
    if (f.status === "accepted") return "Accepted by Helper";
    if (f.status === "fulfilled") return "Fulfilled";
    return "Unfulfilled";
  };

  const passesTime = (n: Need) => {
    if (range === "all") return true;
    const created = n.created_at ? new Date(n.created_at) : null;
    if (!created) return false;
    const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (range === "day") return days <= 1;
    if (range === "week") return days <= 7;
    if (range === "month") return days <= 30;
    return true;
  };

  const passesKeyword = (n: Need) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    const hay = [
      n.title,
      n.description,
      n.category,
      n.city,
      n.state,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  };

  const filtered = needs.filter((n) => passesTime(n) && passesKeyword(n));

  return (
    <>
      <Head><title>All Needs — 4MK</title></Head>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">All Needs</h1>
        </div>

        {/* ✅ Unified filters */}
        <NeedFilters
          q={q}
          onQ={setQ}
          range={range}
          onRange={setRange}
          className="mb-6"
        />

        {loading && <p>Loading…</p>}
        {err && <p className="text-red-600">Error: {err}</p>}
        {!loading && !err && filtered.length === 0 && <p>No needs found.</p>}

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((need) => (
            <Link
              key={need.id}
              href={`/needs/${need.id}`}
              className="block border rounded-lg p-4 shadow-sm bg-white hover:bg-purple-50 transition"
            >
              <h2 className="text-lg font-semibold mb-1">{need.title}</h2>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {need.description}
              </p>
              <div className="text-xs text-gray-500">
                {(need.city || "—")}{need.state ? `, ${need.state}` : ""} •{" "}
                {need.created_at ? new Date(need.created_at).toLocaleString() : ""}
              </div>
              <span
                className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                  statusFor(need.id) === "Unfulfilled"
                    ? "bg-yellow-100 text-yellow-800"
                    : statusFor(need.id) === "Accepted by Helper"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {statusFor(need.id)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
