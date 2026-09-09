import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/src/components/auth/update-password-form";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";
import { createClient } from "@/src/lib/supabase/server";

export const metadata: Metadata = {
  title: "Update password | NAADIX",
  robots: { index: false, follow: false },
};

export default async function UpdatePasswordPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims) redirect("/forgot-password");
  }

  return (
    <AuthShell
      eyebrow="PERSONAL HQ"
      title="Choose a new password"
      description="Use a strong password you do not reuse elsewhere."
    >
      <UpdatePasswordForm configured={configured} />
    </AuthShell>
  );
}
