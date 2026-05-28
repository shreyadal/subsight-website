import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncGmail } from "@/lib/gmail/sync";

export async function POST(_req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncGmail(user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "ALREADY_SYNCING") {
      return NextResponse.json(
        { error: "A sync is already running. Please wait a moment." },
        { status: 409 }
      );
    }

    const status =
      message.includes("not connected") || message.includes("expired") ? 400 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
