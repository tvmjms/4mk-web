import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

type Need = Database["public"]["Tables"]["needs"]["Row"];
type Fulfillment = Database["public"]["Tables"]["fulfillment"]["Row"];

type ProposalWithHelper = Fulfillment & {
  helper_email?: string;
  helper_display_name?: string;
};

export default function NeedProposalsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const { id } = router.query as { id?: string };

  const [need, setNeed] = useState<Need | null>(null);
  const [proposals, setProposals] = useState<ProposalWithHelper[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, supabase, user?.id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    setErr(null);
    setOk(null);

    // Load the need
    const { data: nData, error: nErr } = await supabase
      .from("needs")
      .select("*")
      .eq("id", id)
      .single();

    if (nErr) {
      setErr(nErr.message);
      setLoading(false);
      return;
    }

    setNeed(nData);

    // Check if user is the owner
    if (!user || nData.owner_id !== user.id) {
      setErr("You are not authorized to view proposals for this need");
      setLoading(false);
      return;
    }

    // Load proposals (status = proposed)
    const { data: proposalsData, error: pErr } = await supabase
      .from("fulfillment")
      .select("*")
      .eq("need_id", id)
      .eq("status", "proposed")
      .order("created_at", { ascending: false });

    if (pErr) {
      setErr(pErr.message);
      setLoading(false);
      return;
    }

    // Fetch helper info for each proposal
    const proposalsWithHelpers: ProposalWithHelper[] = [];
    for (const proposal of proposalsData || []) {
      // Get helper's auth.users email via a supabase function or by querying auth metadata
      // Note: We can't directly query auth.users from the client, so we'll use the helper_id
      // In a real app, you might want to have a user_profile table with display names
      proposalsWithHelpers.push({
        ...proposal,
        helper_email: `User ${proposal.helper_id.substring(0, 8)}...`,
      });
    }

    setProposals(proposalsWithHelpers);
    setLoading(false);
  }

  async function handleAccept(fulfillmentId: string) {
    if (!confirm("Accept this proposal? This will notify the helper.")) return;

    setProcessing(fulfillmentId);
    setErr(null);
    setOk(null);

    const { error } = await supabase
      .from("fulfillment")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", fulfillmentId);

    setProcessing(null);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Proposal accepted successfully!");
    // Reload to refresh the list
    loadData();
  }

  async function handleDecline(fulfillmentId: string) {
    if (!confirm("Decline this proposal?")) return;

    setProcessing(fulfillmentId);
    setErr(null);
    setOk(null);

    const { error } = await supabase
      .from("fulfillment")
      .update({
        status: "declined",
      })
      .eq("id", fulfillmentId);

    setProcessing(null);

    if (error) {
      setErr(error.message);
      return;
    }

    setOk("Proposal declined");
    // Reload to refresh the list
    loadData();
  }

  if (!user) {
    return (
      <>
        <Head><title>Proposals — 4MK</title></Head>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p>Please log in to view proposals.</p>
          <Link href={`/login?next=${encodeURIComponent(router.asPath)}`} className="text-purple-600 underline">
            Log in
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>{need?.title ? `Proposals for ${need.title}` : "Proposals"} — 4MK</title></Head>
      <div className="min-h-screen bg-[#373737] py-8 px-3">
        <div className="mx-auto max-w-4xl rounded-[28px] bg-gradient-to-b from-pink-200 to-pink-300 p-6 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] ring-2 ring-[#DBB35D]">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-extrabold text-neutral-900">
              Proposals
            </h1>
            <Link href={id ? `/needs/${id}` : "/"} className="text-sm underline text-neutral-800">
              ← Back to Need
            </Link>
          </div>

          {loading && <p className="text-neutral-800">Loading…</p>}
          {err && <p className="text-red-700 mb-4">{err}</p>}
          {ok && <p className="text-green-700 mb-4">{ok}</p>}

          {!loading && need && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-2">{need.title}</h2>
              <p className="text-sm text-neutral-700">
                {need.city}{need.state ? `, ${need.state}` : ""} • {need.category || "other"}
              </p>
            </div>
          )}

          {!loading && proposals.length === 0 && (
            <div className="rounded-2xl bg-white/70 p-6 shadow">
              <p className="text-neutral-700">No proposals yet. Share your need to get help!</p>
            </div>
          )}

          {!loading && proposals.length > 0 && (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="rounded-2xl bg-white/90 p-4 shadow-lg border border-neutral-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 mb-1">
                        Helper: {proposal.helper_email}
                      </p>
                      <p className="text-xs text-neutral-600">
                        Proposed on: {new Date(proposal.created_at).toLocaleString()}
                      </p>
                      {proposal.message && (
                        <p className="text-sm text-neutral-700 mt-2 italic">
                          &ldquo;{proposal.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleAccept(proposal.id)}
                        disabled={processing === proposal.id}
                        className="rounded-full bg-emerald-700 text-white px-4 py-2 text-sm shadow hover:opacity-90 disabled:opacity-50"
                      >
                        {processing === proposal.id ? "..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleDecline(proposal.id)}
                        disabled={processing === proposal.id}
                        className="rounded-full bg-neutral-600 text-white px-4 py-2 text-sm shadow hover:opacity-90 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
