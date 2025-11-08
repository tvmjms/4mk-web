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

function NeedsList({ 
  pageSize = 5, 
  columns = 2,
  ownerId,
  helperId
}: { 
  pageSize?: number; 
  columns?: number;
  ownerId?: string;
  helperId?: string;
}) {
  const router = useRouter()
  const [needs, setNeeds] = useState<ProcessedNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'new' | 'help_offered' | 'help_accepted' | 'fulfilled' | 'Help Offered' | 'Help Accepted'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [showCustomDates, setShowCustomDates] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'help_offered': 
      case 'help offered': return 'bg-yellow-100 text-yellow-800';
      case 'help_accepted':
      case 'help accepted': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatStatusDisplay = (status: string) => {
    if (!status) return 'new';
    const statusLower = status.toLowerCase();
    if (statusLower === 'help_offered' || statusLower === 'help offered') return 'Help Offered';
    if (statusLower === 'help_accepted' || statusLower === 'help accepted') return 'Help Accepted';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const offset = (page - 1) * pageSize

  const term = useMemo(() => query.trim(), [query])

  // Calculate date filter
  const dateFilterISO = useMemo(() => {
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate).toISOString(),
        end: new Date(customEndDate + 'T23:59:59').toISOString()
      }
    }
    if (dateFilter === 'all') return null
    const now = Date.now()
    let ms = 0
    if (dateFilter === 'day') ms = 24 * 60 * 60 * 1000
    if (dateFilter === 'week') ms = 7 * 24 * 60 * 60 * 1000
    if (dateFilter === 'month') ms = 30 * 24 * 60 * 60 * 1000
    return ms ? new Date(now - ms).toISOString() : null
  }, [dateFilter, customStartDate, customEndDate])

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
      
      // If helperId is provided, we need to get needs from fulfillment table
      if (helperId) {
        // Get need IDs from fulfillments where user is the helper
        const { data: fulfillments, error: fulfillmentError } = await supabase
          .from('fulfillment')
          .select('need_id')
          .eq('helper_id', helperId)
        
        if (fulfillmentError || !fulfillments || fulfillments.length === 0) {
          if (cancelled) return
          setNeeds([])
          setTotal(0)
          setLoading(false)
          return
        }
        
        const needIds = fulfillments.map(f => f.need_id)
        
        // Now get the needs
        let q = supabase
          .from('needs')
          .select('*', { count: 'exact' })
          .in('id', needIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1)

        if (status !== 'all') {
          let normalizedStatus = status;
          if (status === 'help_offered' || status === 'Help Offered') {
            normalizedStatus = 'Help Offered';
          } else if (status === 'help_accepted' || status === 'Help Accepted') {
            normalizedStatus = 'Help Accepted';
          }
          q = q.eq('status', normalizedStatus)
        }
        if (term) {
          q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
        }
        
        if (dateFilterISO) {
          if (typeof dateFilterISO === 'string') {
            q = q.gte('created_at', dateFilterISO)
          } else {
            q = q.gte('created_at', dateFilterISO.start).lte('created_at', dateFilterISO.end)
          }
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
          
          // Limit title to 5 words maximum to prevent layout issues
          const maxWords = 5;
          const processedNeeds: ProcessedNeed[] = rawNeeds.map((need) => {
            const words = need.title.trim().split(/\s+/);
            if (words.length <= maxWords) {
              return { ...need, displayTitle: need.title };
            }
            
            const truncated = words.slice(0, maxWords).join(' ') + '...';
            return { ...need, displayTitle: truncated };
          });
          
          setNeeds(processedNeeds);
          setLoading(false);
        }
        return
      }
      
      // Regular needs query
      let q = supabase
        .from('needs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      // Filter by owner if provided
      if (ownerId) {
        q = q.eq('owner_id', ownerId)
      }

      if (status !== 'all') {
        // Normalize status value to match database format (handle both underscore and space formats)
        let normalizedStatus = status;
        if (status === 'help_offered' || status === 'Help Offered') {
          // Try both formats - database might use 'Help Offered' or 'help_offered'
          normalizedStatus = 'Help Offered';
        } else if (status === 'help_accepted' || status === 'Help Accepted') {
          normalizedStatus = 'Help Accepted';
        }
        // Use case-insensitive matching or try both formats
        // First try the normalized format, if that doesn't work, the database might use underscores
        q = q.eq('status', normalizedStatus)
      }
      if (term) {
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      }
      
      // Apply date filter
      if (dateFilterISO) {
        if (typeof dateFilterISO === 'string') {
          // Single date (day/week/month)
          q = q.gte('created_at', dateFilterISO)
        } else {
          // Custom date range
          q = q.gte('created_at', dateFilterISO.start).lte('created_at', dateFilterISO.end)
        }
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
        
        // Limit title to 5 words maximum to prevent layout issues
        const maxWords = 5;
        const processedNeeds: ProcessedNeed[] = rawNeeds.map((need) => {
          const words = need.title.trim().split(/\s+/);
          if (words.length <= maxWords) {
            return { ...need, displayTitle: need.title };
          }
          
          const truncated = words.slice(0, maxWords).join(' ') + '...';
          return { ...need, displayTitle: truncated };
        });
        
        setNeeds(processedNeeds);
        setLoading(false);
      }
    }
    load()
    return () => { cancelled = true }
  }, [page, pageSize, offset, term, status, dateFilterISO, ownerId, helperId])

  const canPrev = page > 1
  const canNext = page < totalPages

  // Determine if we're in full page mode (larger pageSize) or dashboard mode
  const isFullPage = pageSize >= 30;
  const isDashboard = ownerId !== undefined || helperId !== undefined;
  
  // If full page mode or dashboard mode, render without the section wrapper
  if (isFullPage || isDashboard) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Toolbar: search + status filter + date filters - all in one line */}
        <div className="mb-4 flex items-center gap-1.5 justify-center flex-wrap">
          <input
            value={query}
            onChange={(e) => { setPage(1); setQuery(e.target.value) }}
            placeholder="Search…"
            className="px-2.5 py-1 rounded-md text-xs input-turquoise flex-1 min-w-[90px]"
          />
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value as any) }}
            className="px-2.5 py-1 rounded-md text-xs input-turquoise"
            aria-label="Filter status"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="help_offered">Help Offered</option>
            <option value="help_accepted">Help Accepted</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => {
              setPage(1);
              const value = e.target.value as typeof dateFilter;
              setDateFilter(value);
              setShowCustomDates(value === 'custom');
            }}
            className="px-2.5 py-1 rounded-md text-xs input-turquoise"
            aria-label="Filter by date"
          >
            <option value="all">All Time</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="custom">Custom Date</option>
          </select>
          {showCustomDates && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => { setPage(1); setCustomStartDate(e.target.value) }}
                className="px-2.5 py-1 rounded-md text-xs input-turquoise"
                placeholder="Start"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => { setPage(1); setCustomEndDate(e.target.value) }}
                className="px-2.5 py-1 rounded-md text-xs input-turquoise"
                placeholder="End"
              />
            </>
          )}
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

        <div className="flex-1 overflow-y-auto">
          <div 
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {needs.map(n => {
              const time = n.created_at ? new Date(n.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : ''
              const isOwner = currentUser && n.owner_id === currentUser.id;
              const targetHref = `/needs/${n.id}`;
              
              return (
                <div 
                  key={n.id} 
                  className={`needs-item-card p-1.5 hover:shadow-lg focus-within:ring-2 focus-within:ring-white/40 cursor-pointer ${isOwner ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''}`}
                  onClick={() => {
                    router.push(targetHref);
                  }}
                >
                  {/* Row 1: Title with yellow star for owner - limited to 5 words, one line */}
                  <div className="flex items-center gap-1.5">
                    <h3 
                      className="font-semibold leading-tight text-gray-900 text-[10px] flex-1 truncate" 
                      title={n.title}
                    >
                      {n.displayTitle || n.title}
                      {isOwner && <span className="ml-1 text-yellow-500 text-xs font-bold">*</span>}
                    </h3>
                  </div>

                  {/* Row 2: Location + Requested time + Status */}
                  <div className="mt-0.5 text-[8px] text-gray-700 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    {n.city && <span>{n.city}</span>}
                    {time && <span>{time}</span>}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${getStatusColor(n.status || 'new')}`}>
                      {formatStatusDisplay(n.status || 'new')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pagination with legend */}
        <div className="mt-3 flex items-center justify-between gap-1 pt-3 border-t border-white/10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-1">
            <button
              className="px-1.5 py-0.5 rounded text-xs btn-silver disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              ◀
            </button>
            <span className="text-white/90 text-xs font-medium px-1.5">{total ? page : 0}</span>
            <button
              className="px-1.5 py-0.5 rounded text-xs btn-silver disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={!canNext}
              aria-label="Next page"
            >
              ▶
            </button>
          </div>
          <div className="flex-1 flex justify-end">
            <span className="text-yellow-400 text-[10px] italic">* indicates your need</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section 
      aria-label="All Needs" 
      className="w-full h-[315px] list-gradient-panel relative cursor-pointer"
      onClick={(e) => {
        // Only navigate if clicking on the card background, not on interactive elements
        const target = e.target as HTMLElement;
        // Don't navigate if clicking on:
        // - Individual need cards
        // - Filter inputs/selects
        // - Pagination buttons
        // - Any buttons or links
        if (
          target.closest('.needs-item-card') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('button') ||
          target.closest('a')
        ) {
          return;
        }
        // Navigate to All Needs page
        router.push('/needs');
      }}
    >
      {/* Gold rim/frame overlays to match purple card */}
      <div className="card-rim" />
      <div className="card-gold-frame" />
      
      {/* Logo variants used inside the card (matching parent card) */}
      {/* Removed card-logo-shadow as requested */}
      <div className="card-logo-main">All Needs</div>

  <div className="max-w-2xl mx-auto relative z-10 h-full flex flex-col pt-10 px-3">
        {/* Toolbar: search + status filter + date filters - all in one line */}
        <div className="mb-2 flex items-center gap-2 justify-center flex-wrap mt-2">
            <input
              value={query}
              onChange={(e) => { setPage(1); setQuery(e.target.value) }}
              placeholder="Search…"
              className="px-2 py-1 rounded-md text-xs input-turquoise flex-1 min-w-[120px]"
            />
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as any) }}
              className="px-2 py-1 rounded-md text-xs input-turquoise"
              aria-label="Filter status"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="help_offered">Help Offered</option>
              <option value="help_accepted">Help Accepted</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => {
                setPage(1);
                const value = e.target.value as typeof dateFilter;
                setDateFilter(value);
                setShowCustomDates(value === 'custom');
              }}
              className="px-2 py-1 rounded-md text-xs input-turquoise"
              aria-label="Filter by date"
            >
              <option value="all">All Time</option>
              <option value="day">Last Day</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="custom">Custom Date</option>
            </select>
            {showCustomDates && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => { setPage(1); setCustomStartDate(e.target.value) }}
                  className="px-2 py-1 rounded-md text-xs input-turquoise"
                  placeholder="Start"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => { setPage(1); setCustomEndDate(e.target.value) }}
                  className="px-2 py-1 rounded-md text-xs input-turquoise"
                  placeholder="End"
                />
              </>
            )}
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
              onClick={() => {
                router.push(targetHref);
              }}
            >
              {/* Row 1: Title with yellow star for owner - limited to 5 words, one line */}
              <div className="flex items-center gap-2">
                <h3 
                  className="font-semibold leading-tight text-gray-900 text-[10px] flex-1 truncate" 
                  title={n.title}
                >
                  {n.displayTitle || n.title}
                  {isOwner && <span className="ml-1 text-yellow-500 text-[12px] font-bold">*</span>}
                </h3>
              </div>

              {/* Row 2: Location + Requested time + Status */}
              <div className="mt-0.5 text-[8px] text-gray-700 flex flex-wrap items-center gap-x-2 gap-y-1">
                {n.city && <span>{n.city}</span>}
                {time && <span>{time}</span>}
                <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${getStatusColor(n.status || 'new')}`}>
                  {formatStatusDisplay(n.status || 'new')}
                </span>
              </div>
            </div>
          )
        })}
    </div>
    {/* Inline pagination with legend */}
    <div className="mt-2 flex items-center justify-between gap-1" style={{ marginBottom: '12px' }}>
      <div className="flex-1"></div>
      <div className="flex items-center gap-1">
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
      <div className="flex-1 flex justify-end">
        <span className="text-yellow-400 text-[8px] italic">* indicates your need</span>
      </div>
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
