import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

export default function CreateNeedPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [category, setCategory] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent("/needs/create")}`);
      }
    })();
  }, [router, supabase]);

  async function submit() {
    setMsg(null);
    if (!title.trim()) { setMsg("Please enter a title."); return; }
    try {
      setSaving(true);
      const { error } = await supabase.from("needs").insert({
        title: title.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        category: category.trim() || null,
        owner_id: user?.id ?? null,
      });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (e: unknown) {
      setMsg((e as Error)?.message ?? "Failed to create need");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head><title>Create Need — 4MK</title></Head>
      <div className="min-h-screen bg-[#373737] py-8 px-3">
        <div className="mx-auto max-w-3xl rounded-[28px] bg-gradient-to-b from-pink-200 to-pink-300 p-6 md:p-10 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ring-2 ring-[#E3B341]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-neutral-900">Create Need</h1>
            <Link href="/" className="text-sm underline text-neutral-800">← Back to Home</Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <input
              className="rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600 min-h-[120px]"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                className="rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
                placeholder="State"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <input
              className="rounded-xl bg-white/95 border border-neutral-300 px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-emerald-600"
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <div className="flex gap-2 pt-2">
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-full bg-emerald-700 text-white px-5 py-2 shadow hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Create Need"}
              </button>
              <Link href="/" className="rounded-full bg-neutral-900 text-white px-5 py-2 shadow hover:opacity-90">
                Cancel
              </Link>
            </div>

            {msg && <div className="text-sm text-red-700">{msg}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
