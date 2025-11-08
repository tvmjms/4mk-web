import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

type Need = {
  id: string
  title: string
  description?: string
  city?: string
  created_at?: string
  status?: string
  owner_id?: string
}

type ProcessedNeed = Need & {
  displayTitle?: string
}

function NeedsList({ pageSize = 5 }: { pageSize?: number }) {
  const router = useRouter()
  const [needs, setNeeds] = useState<ProcessedNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'new'>('all')
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const offset = (page - 1) * pageSize

  const term = useMemo(() => query.trim(), [query])

  // Get current user on mount - optimized
  useEffect(() => {
    let mounted = true;
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.warn('Failed to get user:', error);
      }
    };
    getUser();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      let q = supabase
        .from('needs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (status !== 'all') {
        q = q.eq('status', status)
      }
      if (term) {
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      }

      const { data, error, count } = await q

      if (cancelled) return
      if (error) {
        setError(error.message)
        setNeeds([])
        setTotal(0)
        setLoading(false)
      } else {
        const rawNeeds = (data as Need[]) || []
        setTotal(count || 0)
        
        // Fast title processing - no AI, just smart truncation
        const maxTitleLength = 45;
        const processedNeeds: ProcessedNeed[] = rawNeeds.map((need) => {
          if (need.title.length <= maxTitleLength) {
            return { ...need, displayTitle: need.title };
          }
          
          // Smart truncation - try to break at word boundaries
          const truncated = need.title.length > maxTitleLength 
            ? need.title.substring(0, maxTitleLength - 3).replace(/\s+\w*$/, '') + '...'
            : need.title;
          
          return { ...need, displayTitle: truncated };
        });
        
        setNeeds(processedNeeds);
        setLoading(false);
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, pageSize, offset, term, status])

  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <section aria-label="All Needs" className="w-full h-[315px] list-gradient-panel relative">
      {/* Gold rim/frame overlays to match purple card */}
      <div className="card-rim" />
      <div className="card-gold-frame" />
      
      {/* Logo variants used inside the card (matching parent card) */}
      <div className="card-logo-shadow">All Needs</div>
      <div className="card-logo-main">All Needs</div>

  <div className="max-w-2xl mx-auto relative z-10 h-full flex flex-col pt-6 px-3">
        {/* Toolbar: search + status filter */}
        <div className="mb-2 flex items-center gap-2 justify-center">
            <input
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value) }}
              placeholder="Search…"
              className="px-2 py-1 rounded-md text-xs input-turquoise"
            />
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as any) }}
              className="px-2 py-1 rounded-md text-xs input-turquoise"
              aria-label="Filter status"
            >
              <option value="all">All</option>
              <option value="new">New</option>
            </select>
        </div>

      {loading && (
        <div className="text-white/90 text-xs">Loading…</div>
      )}
      {error && (
        <div className="text-red-200 text-xs">Error: {error}</div>
      )}
      {!loading && !error && needs.length === 0 && (
        <div className="text-white/90 text-xs">No open needs found.</div>
      )}

  <div className="flex-1 overflow-hidden">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {needs.map(n => {
          const time = n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : ''
          const isOwner = currentUser && n.owner_id === currentUser.id;
          const targetHref = `/needs/${n.id}`; // All users go to receipt view
          
          return (
            <div 
              key={n.id} 
              className={`needs-item-card p-1.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-white/40 cursor-pointer ${isOwner ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''}`}
              onClick={(e) => {
                // Only navigate if not clicking on action button
                if (!(e.target as HTMLElement).closest('button')) {
                  router.push(targetHref);
                }
              }}
            >
              {/* Row 1: Title + Action button */}
              <div className="flex items-center justify-between gap-2">
                <h3 
                  className="font-semibold leading-tight text-gray-900 text-[10px] flex-1 truncate" 
                  title={n.title} // Show full title on hover
                >
                  {n.displayTitle || n.title}
                  {isOwner && <span className="ml-1 text-blue-600 text-[8px]">👤</span>}
                </h3>
                {isOwner ? (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/needs/${n.id}/edit`);
                    }}
                    className="shrink-0 px-1 py-0.5 rounded text-[6px] font-semibold uppercase tracking-wide bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    title="Edit your need"
                  >
                    Edit
                  </button>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/needs/${n.id}`);
                    }}
                    className="shrink-0 px-1 py-0.5 rounded text-[6px] font-semibold uppercase tracking-wide btn-blue transition-colors"
                    title="View details and offer help"
                  >
                    Help
                  </button>
                )}
              </div>

              {/* Row 2: Location + Requested time */}
              <div className="mt-0.5 text-[8px] text-gray-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                {n.city && <span>📍 {n.city}</span>}
                {time && <span>{time}</span>}
                <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${getStatusColor(n.status || 'new')}`}>
                  {isOwner && '⭐ '}{n.status || 'new'}
                </span>
              </div>
            </div>
          )
        })}
    </div>
    {/* Inline pagination with minimal bottom spacing */}
    <div className="mt-2 flex items-center justify-center gap-1" style={{ marginBottom: '12px' }}>
          <button
            className="px-1.5 py-0.5 rounded text-[10px] btn-silver disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            ◀
          </button>
          <span className="text-white/90 text-xs font-medium">{total ? page : 0}</span>
          <button
            className="px-1.5 py-0.5 rounded text-[10px] btn-silver disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={!canNext}
            aria-label="Next page"
          >
            ▶
          </button>
    </div>
  </div>

      {/* Pagination controls (hidden, replaced by inline above) */}
  <div className="hidden">
          <button
            className="px-3 py-2 rounded-md text-sm btn-silver disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            ◀
          </button>
          <span className="text-white/80 text-sm">{total ? page : 0}</span>
          <button
            className="px-3 py-2 rounded-md text-sm btn-silver disabled:opacity-50"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={!canNext}
            aria-label="Next page"
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  )
}

export default React.memo(NeedsList);
