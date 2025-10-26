// /lib/supabase.ts
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// ✅ Use the Next.js-aware browser client
export const supabase = createPagesBrowserClient<Database>();

// (Optional) Admin client for API routes, still safe to keep if you use it:
import { createClient } from "@supabase/supabase-js";

export function getAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
