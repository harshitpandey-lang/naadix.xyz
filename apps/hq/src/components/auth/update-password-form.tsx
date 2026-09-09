"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";

export function UpdatePasswordForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmation") || "");

    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    if (!configured) return setError("Personal HQ is not configured yet. Please try again later.");

    setError("");
    setPending(true);

    try {
      const { error: updateError } = await createClient().auth.updateUser({ password });
      if (updateError) setError("This reset link is no longer valid. Please request another one.");
      else router.replace("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-medium text-[var(--hq-cream)]">
        New password
        <span className="relative">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" className="w-full rounded-lg border border-[var(--hq-line)] bg-white/5 px-4 py-3 pr-12 text-white outline-none focus:border-[#8cbde0]" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[var(--hq-muted)]" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--hq-cream)]">
        Confirm new password
        <input name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" className="rounded-lg border border-[var(--hq-line)] bg-white/5 px-4 py-3 text-white outline-none focus:border-[#8cbde0]" />
      </label>
      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      <button disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--hq-cream)] px-4 font-semibold text-[var(--hq)] disabled:opacity-70">
        {pending && <LoaderCircle size={17} className="animate-spin" />}
        {pending ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
