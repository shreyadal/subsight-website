import { createServerClient } from "@/lib/supabase/server";

export interface UploadedStatement {
  id: string;
  filename: string;
  file_size: number;
  status: "processing" | "done" | "error";
  bank_name: string | null;
  period_from: string | null;
  period_to: string | null;
  transaction_count: number;
  error_message: string | null;
  created_at: string;
}

export async function getUploadedStatements(): Promise<UploadedStatement[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("uploaded_statements")
    .select("id, filename, file_size, status, bank_name, period_from, period_to, transaction_count, error_message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false }) as { data: UploadedStatement[] | null; error: unknown };

  if (error || !data) return [];
  return data;
}
