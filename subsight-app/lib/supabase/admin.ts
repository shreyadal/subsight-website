import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

// Service role client — bypasses RLS. Server-only. Never expose to client.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
