// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Browser/client-side Supabase (anon key) – safe to import in pages/components.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true } }
);

/**
 * Server-only admin client (SERVICE_ROLE key). Keep this private.
 * Use ONLY in API routes or server utilities.
 */
export function getAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose to the browser
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
