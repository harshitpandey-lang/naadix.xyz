import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/src/lib/auth";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next") ?? undefined);
  url.pathname = code && isSupabaseConfigured() ? next : "/forgot-password";
  url.search = "";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) url.pathname = "/forgot-password";
  }

  return NextResponse.redirect(url);
}
