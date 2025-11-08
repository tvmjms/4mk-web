'use client';
import { useState, useEffect } from 'react';

export type Filters = {
  q: string;
  timeframe: 'all' | '24h' | '7d' | '30d';
  sort: 'newest' | 'oldest';
};

export default function NeedFilters({
  onChange,
  initial,
}: {
  onChange: (f: Filters) => void;
  initial?: Partial<Filters>;
}) {
  const [q, setQ] = useState(initial?.q ?? '');
  const [timeframe, setTimeframe] = useState<Filters['timeframe']>(initial?.timeframe ?? 'all');
  const [sort, setSort] = useState<Filters['sort']>(initial?.sort ?? 'newest');

  useEffect(() => { onChange({ q, timeframe, sort }); }, [q, timeframe, sort]);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title, description, location..."
        className="flex-1 min-w-[240px] rounded-xl bg-white/90 border border-neutral-300 px-4 py-2 shadow-inner outline-none focus:ring-2 focus:ring-neutral-400"
      />
      <select
        value={timeframe} onChange={(e) => setTimeframe(e.target.value as Filters['timeframe'])}
        className="rounded-xl bg-white/90 border border-neutral-300 px-3 py-2"
      >
        <option value="all">All time</option>
        <option value="24h">Last 24h</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <select
        value={sort} onChange={(e) => setSort(e.target.value as Filters['sort'])}
        className="rounded-xl bg-white/90 border border-neutral-300 px-3 py-2"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
    </div>
  );
}
