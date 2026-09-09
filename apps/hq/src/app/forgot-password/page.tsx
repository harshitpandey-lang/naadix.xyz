import type { Metadata } from "next";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/src/components/auth/forgot-password-form";
import { isSupabaseConfigured } from "@/src/lib/supabase/config";

export const metadata: Metadata = {
  title: "Reset password | NAADIX",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="PERSONAL HQ"
      title="Reset your password"
      description="Enter your email and we’ll send a secure reset link if an account matches it."
    >
      <ForgotPasswordForm configured={isSupabaseConfigured()} />
    </AuthShell>
  );
}
