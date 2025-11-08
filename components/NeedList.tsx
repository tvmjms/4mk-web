// components/NeedList.tsx
import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Need } from "../types/database";

type Scope = "all" | "mine" | "accepted";

type Props = {
  scope?: Scope;
  pageSize?: number;
};

const timeOptions = [
  { label: "All time", value: "all" as const },
  { label: "24 hours", value: "24h" as const },
  { label: "7 days", value: "7d" as const },
  { label: "30 days", value: "30d" as const },
];

export default function NeedList({ scope = "all", pageSize = 6 }: Props) {
  const supabase = useSupabaseClient();
  const user = useUser();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [time, setTime] = useState<(typeof timeOptions)[number]["value"]>("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Compute time filter date
  const sinceISO = useMemo(() => {
    const now = Date.now();
    let ms = 0;
    if (time === "24h") ms = 24 * 60 * 60 * 1000;
    if (time === "7d") ms = 7 * 24 * 60 * 60 * 1000;
    if (time === "30d") ms = 30 * 24 * 60 * 60 * 1000;
    return ms ? new Date(now - ms).toISOString() : null;
  }, [time]);

  // Debounce search text
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Fetch
  useEffect(() => {
    let isCancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      // base
      let query = supabase
        .from("needs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: sort === "oldest" });

      // scope
      if (scope === "mine" && user?.id) query = query.eq("owner_id", user.id);

      // time
      if (sinceISO) query = query.gte("created_at", sinceISO);

      // search OR across a few columns
      if (debouncedQ) {
        const like = `%${debouncedQ}%`;
        query = query.or(
          [
            `title.ilike.${like}`,
            `description.ilike.${like}`,
            `city.ilike.${like}`,
            `state.ilike.${like}`,
          ].join(",")
        );
      }

      // pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (isCancelled) return;

      if (error) {
        setError(error.message);
        setItems([]);
      } else {
        setItems((data as Need[]) ?? []);
        setTotal(count ?? 0);
      }
      setLoading(false);
    }

    run();
    return () => {
      isCancelled = true;
    };
  }, [supabase, scope, user?.id, sort, sinceISO, debouncedQ, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search title, description, location..."
          className="w-full rounded-xl px-4 py-2 bg-white/90 text-neutral-900 outline-none ring-1 ring-black/10 focus:ring-2"
        />
        <select
          value={time}
          onChange={(e) => {
            setTime(e.target.value as any);
            setPage(1);
          }}
          className="rounded-xl px-3 py-2 bg-white/90 text-neutral-900 ring-1 ring-black/10"
        >
          {timeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as any);
            setPage(1);
          }}
          className="rounded-xl px-3 py-2 bg-white/90 text-neutral-900 ring-1 ring-black/10"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="text-sm text-white/80">Loading…</div>}
        {error && <div className="text-sm text-red-100">Error: {error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-white/80">No results.</div>
        )}
        {items.map((n) => (
          <a key={n.id} href={`/needs/${n.id}`} className="block rounded-xl bg-white shadow p-4 border border-neutral-200 hover:shadow-md transition">
            <div className="text-xs text-neutral-500">{new Date(n.created_at).toLocaleString()}</div>
            <div className="mt-1 text-lg font-semibold text-neutral-900">{n.title}</div>
            <div className="mt-1 text-sm text-neutral-700">
              {n.city ? `${n.city}, ` : ""}{n.state ?? ""} • {n.category ?? "other"}
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <button
          className="px-3 py-1 rounded-full bg-black/20 text-white/90 disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
        >
          Prev
        </button>
        <div className="text-white/90 text-sm">Page {page} / {totalPages}</div>
        <button
          className="px-3 py-1 rounded-full bg-black/20 text-white/90 disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
