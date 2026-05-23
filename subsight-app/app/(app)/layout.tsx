import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { createServerClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only enforce auth when Supabase is configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
  }

  return (
    <div className="flex min-h-screen pb-16 lg:pb-0">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
      <MobileNav />
    </div>
  );
}
