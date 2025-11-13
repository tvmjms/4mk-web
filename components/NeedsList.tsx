import React, { useEffect, useMemo, useState, useCallback } from 'react'
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

/**
 * Standardized spacing constants:
 * - All gaps: gap-3 (12px)
 * - Toolbar to list: mb-3 (12px)
 * - List to pagination: mt-3 (12px)
 * - Card padding: 18px 30px 12px 30px (top, left, bottom, right)
 */
function NeedsList({ 
  pageSize = 5, 
  ownerId, 
  helperId, 
  columns = 2 
}: { 
  pageSize?: number
  ownerId?: string
  helperId?: string
  columns?: number
}) {
  const router = useRouter()
  const [needs, setNeeds] = useState<ProcessedNeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'new' | 'help_offered' | 'help_accepted' | 'fulfilled'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | 'week' | 'month' | 'custom'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [showCustomDates, setShowCustomDates] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'help_offered': return 'bg-cyan-100 text-cyan-800';
      case 'help_accepted': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case 'help_offered': return 'Help Offered';
      case 'help_accepted': return 'Help Accepted';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
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

      // Filter by owner if provided
      if (ownerId) {
        q = q.eq('owner_id', ownerId)
      }

      // Filter by helper if provided (needs that this user has offered to help with)
      if (helperId) {
        // This would require a join with offers table - for now, we'll just show all needs
        // TODO: Implement proper helper filtering when offers table is available
      }

      // Status filter
      if (status !== 'all') {
        q = q.eq('status', status)
      }

      // Date filter
      if (dateFilter === 'day') {
        const dayAgo = new Date()
        dayAgo.setDate(dayAgo.getDate() - 1)
        q = q.gte('created_at', dayAgo.toISOString())
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        q = q.gte('created_at', weekAgo.toISOString())
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        q = q.gte('created_at', monthAgo.toISOString())
      } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
        q = q.gte('created_at', customStartDate).lte('created_at', customEndDate)
      }

      // Search filter
      if (term) {
        q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`)
      }

      // Pagination
      q = q.range(offset, offset + pageSize - 1)

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
  }, [page, pageSize, offset, term, status, dateFilter, customStartDate, customEndDate, ownerId, helperId])

  const canPrev = page > 1
  const canNext = page < totalPages

  // Determine if we're in full page mode (larger pageSize) or dashboard mode
  const isFullPage = pageSize >= 30;
  const isDashboard = ownerId !== undefined || helperId !== undefined;
  
  // If full page mode or dashboard mode, render without the section wrapper
  // Standardized spacing: all gaps use gap-3 (12px) for consistency
  if (isFullPage || isDashboard) {
    return (
      <div className="w-full flex flex-col">
        {/* Toolbar: search + status filter + date filters - all in one line */}
        {/* Standardized spacing: mb-3 (12px) matches grid gap */}
        <div className="mb-3 flex items-center gap-1.5 justify-center flex-wrap">
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

        {/* Standardized grid gap: gap-3 (12px) - consistent across all list cards */}
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

                  {/* Row 2: Location + Requested time + Status - all on one line (standardized layout) */}
                  {/* Standardized: Always on one line, never wrap - matches gap-3 spacing */}
                  <div className="mt-0.5 text-[8px] text-gray-700 flex items-center gap-x-1.5 whitespace-nowrap overflow-hidden">
                    {n.city && <span className="flex-shrink-0">{n.city}</span>}
                    {time && <span className="flex-shrink-0">{time}</span>}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium flex-shrink-0 ${getStatusColor(n.status || 'new')}`}>
                      {formatStatusDisplay(n.status || 'new')}
                    </span>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Pagination with legend */}
        {/* Standardized spacing: mt-3 (12px) matches grid gap - card bottom padding provides additional 12px after pagination */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-0 border-t border-white/10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
            <span className="text-yellow-400 text-[10px] italic whitespace-nowrap">* indicates your need</span>
          </div>
        </div>
      </div>
    );
  }

  // Compact mode for home page
  return (
    <section aria-label="All Needs" className="w-full min-h-[320px] list-gradient-panel relative">
      {/* Gold rim/frame overlays to match purple card */}
      <div className="card-rim" />
      <div className="card-gold-frame" />
      
      {/* Logo variants used inside the card (matching parent card) */}
      <div className="card-logo-shadow">All Needs</div>
      <div className="card-logo-main">All Needs</div>

      <div className="max-w-2xl mx-auto relative z-10 h-full flex flex-col pt-6 px-3">
        {/* Toolbar: search + status filter */}
        {/* Standardized spacing: mb-3 (12px) matches grid gap */}
        <div className="mb-3 flex items-center gap-1.5 justify-center flex-wrap">
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

        {/* Standardized grid gap: gap-3 (12px) - consistent across all list cards */}
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
              const targetHref = `/needs/${n.id}`;
              
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
                      title={n.title}
                    >
                      {n.displayTitle || n.title}
                      {isOwner && <span className="ml-1 text-yellow-500 text-xs font-bold">*</span>}
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

                  {/* Row 2: Location + Requested time + Status - all on one line (standardized layout) */}
                  {/* Standardized: Always on one line, never wrap - matches gap-3 spacing */}
                  <div className="mt-0.5 text-[8px] text-gray-700 flex items-center gap-x-1.5 whitespace-nowrap overflow-hidden">
                    {n.city && <span className="flex-shrink-0">{n.city}</span>}
                    {time && <span className="flex-shrink-0">{time}</span>}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium flex-shrink-0 ${getStatusColor(n.status || 'new')}`}>
                      {formatStatusDisplay(n.status || 'new')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Pagination with legend */}
        {/* Standardized spacing: mt-3 (12px) matches grid gap */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-0 border-t border-white/10">
          <div className="flex-1"></div>
          <div className="flex items-center gap-1 flex-shrink-0">
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
            <span className="text-yellow-400 text-[10px] italic whitespace-nowrap">* indicates your need</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(NeedsList);
