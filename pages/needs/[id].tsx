import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";
import { formatPhoneForDisplay } from "@/lib/phone";

type Need = Database["public"]["Tables"]["needs"]["Row"];
type Fulfillment = Database["public"]["Tables"]["fulfillment"]["Row"];

export default function NeedDetailPage() {
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const { id } = router.query as { id?: string };

  const [need, setNeed] = useState<Need | null>(null);
  const [fulfill, setFulfill] = useState<Fulfillment | null>(null); // accepted/proposed latest
  const [myOffer, setMyOffer] = useState<Fulfillment | null>(null);  // current user's proposal
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      setOk(null);

      // Load the need
      const { data: nData, error: nErr } = await supabase
        .from("needs")
        .select("*")
        .eq("id", id)
        .single();

      // Latest accepted/proposed fulfillment for status badge
      const { data: fData } = await supabase
        .from("fulfillment")
        .select("*")
        .eq("need_id", id)
        .in("status", ["accepted", "proposed"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If logged in, check whether *this* user has already proposed
      let my: Fulfillment | null = null;
      if (user?.id) {
        const { data: myData } = await supabase
          .from("fulfillment")
          .select("*")
          .eq("need_id", id)
          .eq("helper_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        my = myData ?? null;
      }

      if (nErr) setErr(nErr.message);
      setNeed(nData || null);
      setFulfill(fData || null);
      setMyOffer(my);
      setLoading(false);
    })();
  }, [id, supabase, user?.id]);

  const status = useMemo(() => {
    if (!fulfill) return "Unfulfilled";
    if (fulfill.status === "accepted") return "Accepted by a helper";
    if (fulfill.status === "fulfilled") return "Fulfilled";
    return "Unfulfilled";
  }, [fulfill]);

  const isOwner = !!(need && user?.id && need.owner_id === user.id);
  const alreadyProposed = !!myOffer && myOffer.status === "proposed";
  const alreadyAccepted = status === "Accepted by a helper" || status === "Fulfilled";

  // Click handler for the button
  const handleHelp = async () => {
    if (!id) return;

    // Require login, bounce back after success
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Guard rails
    if (isOwner || alreadyAccepted || alreadyProposed) return;

    setSubmitting(true);
    setErr(null);
    setOk(null);

    // Create or upsert a "proposed" row
    const { error } = await supabase.from("fulfillment").insert({
      need_id: id,
      helper_id: user.id,
      status: "proposed",
    });

    setSubmitting(false);

    if (error) {
      // Handle unique (need_id, helper_id) gracefully
      if (/duplicate key|unique/i.test(error.message)) {
        setOk("You’ve already offered to help. Thank you!");
      } else {
        setErr(error.message);
      }
      return;
    }

    setOk("Offer sent! The requester will see your proposal.");
    // Refetch myOffer to reflect the new state
    const { data: myData } = await supabase
      .from("fulfillment")
      .select("*")
      .eq("need_id", id)
      .eq("helper_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMyOffer(myData ?? null);
  };

  return (
    <>
      <Head><title>{need?.title || "Need"} — 4MK</title></Head>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-purple-700">&larr; Back</Link>

        {loading && <p className="mt-4">Loading…</p>}
        {err && <p className="mt-4 text-red-600">Error: {err}</p>}
        {ok && <p className="mt-4 text-green-700">{ok}</p>}

        {!loading && need && (
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-purple-700 mb-2">{need.title}</h1>
            <div className="text-gray-600 mb-4">
              {need.city}{need.state ? `, ${need.state}` : ""} • {need.category || "other"} •{" "}
              {need.created_at ? new Date(need.created_at).toLocaleString() : ""}
            </div>

            {need.description && (
              <p className="mb-4 whitespace-pre-wrap">{need.description}</p>
            )}

            <span
              className={`inline-block mb-6 px-2 py-1 rounded text-xs font-medium ${
                status === "Unfulfilled"
                  ? "bg-yellow-100 text-yellow-800"
                  : status === "Accepted by a helper"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {status}
            </span>

            {/* The button */}
            <button
              type="button"
              onClick={handleHelp}
              disabled={submitting || isOwner || alreadyAccepted || alreadyProposed}
              className={`block mb-6 px-4 py-2 rounded text-white transition
                ${submitting || isOwner || alreadyAccepted || alreadyProposed
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"}`}
              aria-disabled={submitting || isOwner || alreadyAccepted || alreadyProposed}
            >
              {isOwner && "You own this need"}
              {!isOwner && alreadyAccepted && "Already Accepted"}
              {!isOwner && !alreadyAccepted && alreadyProposed && "Offer Sent"}
              {!isOwner && !alreadyAccepted && !alreadyProposed && (submitting ? "Sending…" : "I can help")}
            </button>

            {/* Contact */}
            {(need.contact_email || need.contact_phone_e164) && (
              <div className="text-sm text-gray-800">
                <div className="font-medium mb-1">Contact:</div>
                {need.contact_email && <div>{need.contact_email}</div>}
                {need.contact_phone_e164 && (
                  <div>{formatPhoneForDisplay(need.contact_phone_e164)}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
