// Compatibility shim: re-export the shared supabase client used across the app.
// Some files import from utils/supabaseClient; the canonical client lives in lib/supabase.ts.
import { supabase } from "../lib/supabase";

export { supabase };
export default supabase;
