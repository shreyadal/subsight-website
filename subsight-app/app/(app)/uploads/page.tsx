import { getUploadedStatements } from "@/lib/db/uploads";
import { UploadsClient } from "./uploads-client";

export default async function UploadsPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const uploads = hasSupabase ? await getUploadedStatements() : [];

  return <UploadsClient uploads={uploads} />;
}
