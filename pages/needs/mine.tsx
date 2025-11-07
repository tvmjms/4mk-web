import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';

type NeedRow = {
  id: string;
  title: string;
  city: string | null;
  category: string | null;
  created_at: string;
  fulfilled_at: string | null;
  owner_id: string;
};

type MiniCount = { proposed: number; accepted: number; fulfilled: number; declined: number };

const PAGE_SIZE = 10;

export default function MyNeeds() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // state for each list
  const [rowsUn, setRowsUn] = useState<NeedRow[]>([]);
  const [rowsFul, setRowsFul] = useState<NeedRow[]>([]);
  const [cntUn, setCntUn] = useState(0);
  const [cntFul, setCntFul] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // per-need fulfillment summary for current pages
  const [fulfillCounts, setFulfillCounts] = useState<Record<string, MiniCount>>({});

  const pageUn = Math.max(1, Number((Array.isArray(router.query.un) ? router.query.un[0] : router.query.un) ?? '1') || 1);
  const pageFul = Math.max(1, Number((Array.isArray(router.query.ful) ? router.query.ful[0] : router.query.ful) ?? '1') || 1);

  const fromUn = (pageUn - 1) * PAGE_SIZE;
  const toUn = fromUn + PAGE_SIZE - 1;
  const fromFul = (pageFul - 1) * PAGE_SIZE;
  const toFul = fromFul + PAGE_SIZE - 1;

  // load session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  // load needs (both groups) for the user
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      // Unfulfilled
      const qUn = supabase
        .from('needs')
        .select('id,title,city,category,created_at,fulfilled_at,owner_id', { count: 'exact' })
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .is('fulfilled_at', null)
        .order('created_at', { ascending: false })
        .range(fromUn, toUn);

      // Fulfilled
      const qFul = supabase
        .from('needs')
        .select('id,title,city,category,created_at,fulfilled_at,owner_id', { count: 'exact' })
        .eq('owner_id', userId)
        .is('deleted_at', null)
        .not('fulfilled_at', 'is', null)
        .order('created_at', { ascending: false })
        .range(fromFul, toFul);

      const [unRes, fulRes] = await Promise.all([qUn, qFul]);

      if (cancelled) return;

      if (unRes.error) { setErr(unRes.error.message); setLoading(false); return; }
      if (fulRes.error) { setErr(fulRes.error.message); setLoading(false); return; }

      setRowsUn(unRes.data ?? []);
      setRowsFul(fulRes.data ?? []);
      setCntUn(unRes.count ?? 0);
      setCntFul(fulRes.count ?? 0);
      setLoading(false);

      // fetch fulfillment counts for visible needs on both pages
      const ids = [...(unRes.data ?? []), ...(fulRes.data ?? [])].map(n => n.id);
      if (!ids.length) { setFulfillCounts({}); return; }

      const { data: frows, error: ferr } = await supabase
        .from('fulfillment')
        .select('need_id,status')
        .in('need_id', ids);

      if (ferr) { /* non-fatal */ return; }

      const map: Record<string, MiniCount> = {};
      for (const id of ids) {
        map[id] = { proposed: 0, accepted: 0, fulfilled: 0, declined: 0 };
      }
      (frows ?? []).forEach(r => {
        const m = map[r.need_id];
        if (!m) return;
        if (r.status === 'proposed') m.proposed++;
        else if (r.status === 'accepted') m.accepted++;
        else if (r.status === 'fulfilled') m.fulfilled++;
        else if (r.status === 'declined') m.declined++;
      });
      setFulfillCounts(map);
    })();

    return () => { cancelled = true; };
  }, [userId, pageUn, pageFul]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPagesUn = Math.max(1, Math.ceil(cntUn / PAGE_SIZE));
  const totalPagesFul = Math.max(1, Math.ceil(cntFul / PAGE_SIZE));

  const jump = (patch: Record<string, any>) => {
    router.push({ pathname: '/needs/mine', query: { un: pageUn, ful: pageFul, ...patch } });
  };

  const markFulfilled = async (id: string) => {
    if (!confirm('Mark this need as fulfilled?')) return;
    const { error } = await supabase
      .from('needs')
      .update({ fulfilled_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', userId!);
    if (error) alert(error.message);
    else router.replace(router.asPath);
  };

  return (
    <main style={{ padding: 24, maxWidth: 900 }}>
      <h1>My needs</h1>

      <p>
        <Link href="/needs">← All needs</Link> • <Link href="/needs/new">Create a need</Link>
      </p>

      <p><em>Signed in as:</em> {userEmail ?? '—'}</p>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {loading && <p>Loading…</p>}

      {/* Unfulfilled */}
      <section style={{ marginTop: 16 }}>
        <h2>Unfulfilled</h2>
        {rowsUn.length === 0 ? (
          <p>None yet.</p>
        ) : (
          <ul>
            {rowsUn.map(n => {
              const c = fulfillCounts[n.id] ?? { proposed: 0, accepted: 0, fulfilled: 0, declined: 0 };
              return (
                <li key={n.id} style={{ marginBottom: 8 }}>
                  <Link href={`/needs/${n.id}`}>{n.title}</Link>
                  {n.city && <> — {n.city}</>}
                  {n.category && <> ({n.category})</>}
                  <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                    {c.proposed} proposed • {c.accepted} accepted • {c.fulfilled} fulfilled
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {c.proposed > 0 && (
                      <Link href={`/needs/${n.id}/proposals`} style={{ marginRight: 8 }}>
                        <button>View Proposals ({c.proposed})</button>
                      </Link>
                    )}
                    <button onClick={() => markFulfilled(n.id)}>Mark fulfilled</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {totalPagesUn > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button disabled={pageUn <= 1} onClick={() => jump({ un: pageUn - 1 })}>← Prev</button>
            <span>Page {pageUn} / {totalPagesUn} • {cntUn} total</span>
            <button disabled={pageUn >= totalPagesUn} onClick={() => jump({ un: pageUn + 1 })}>Next →</button>
          </div>
        )}
      </section>

      {/* Fulfilled */}
      <section style={{ marginTop: 24 }}>
        <h2>Fulfilled</h2>
        {rowsFul.length === 0 ? (
          <p>None yet.</p>
        ) : (
          <ul>
            {rowsFul.map(n => (
              <li key={n.id} style={{ marginBottom: 8 }}>
                <Link href={`/needs/${n.id}`}>{n.title}</Link>
                {n.city && <> — {n.city}</>}
                {n.category && <> ({n.category})</>}
                <em> • fulfilled</em>
              </li>
            ))}
          </ul>
        )}

        {totalPagesFul > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <button disabled={pageFul <= 1} onClick={() => jump({ ful: pageFul - 1 })}>← Prev</button>
            <span>Page {pageFul} / {totalPagesFul} • {cntFul} total</span>
            <button disabled={pageFul >= totalPagesFul} onClick={() => jump({ ful: pageFul + 1 })}>Next →</button>
          </div>
        )}
      </section>
    </main>
  );
}
