import Link from "next/link";
import type { Database } from "@/types/supabase";

type Need = Database["public"]["Tables"]["needs"]["Row"];

export default function NeedCard({ need }: { need: Need }) {
  const when = need.created_at ? new Date(need.created_at).toLocaleString() : "";
  return (
    <Link href={`/needs/${need.id}`} className="block need-card">
      <div className="truncate text-xs text-gray-500">{when}</div>
      <h3 className="mt-1 line-clamp-1 text-base font-semibold text-gray-900">{need.title}</h3>
      {need.description && (
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{need.description}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {need.city && <span>{need.city}{need.state ? `, ${need.state}` : ""}</span>}
        {need.category && <span className="rounded-full bg-gray-100 px-2 py-0.5">{need.category}</span>}
      </div>
    </Link>
  );
}
