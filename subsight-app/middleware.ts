import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PROTECTED = [
  "/overview",
  "/subscriptions",
  "/transactions",
  "/insights",
  "/accounts",
  "/gmail",
  "/uploads",
  "/settings",
];
const AUTH_ONLY = ["/login", "/signup", "/forgot"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip if Supabase is not configured (dev without .env.local)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareClient(request);

  // Always refresh the session — keeps the JWT alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname === "/onboarding";

  // Unauthenticated → block protected pages
  if ((isProtected || isOnboarding) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated → skip auth pages (already signed in)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
