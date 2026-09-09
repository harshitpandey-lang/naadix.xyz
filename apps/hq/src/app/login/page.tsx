import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { LoginForm } from "@/src/components/auth/login-form";
import { getSafeNextPath } from "@/src/lib/auth";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Personal HQ | NAADIX",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] | undefined }>;
}) {
  const { next } = await searchParams;
  const nextPath = getSafeNextPath(typeof next === "string" ? next : undefined);
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (claims) redirect(nextPath);
  }
  return (
    <AuthShell
      eyebrow="PERSONAL HQ"
      title="Your private digital workspace."
      description="Sign in to continue to your personal command center."
    >
      <LoginForm nextPath={nextPath} configured={configured} />
    </AuthShell>
  );
}
