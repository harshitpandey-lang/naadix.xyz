"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";

export function ForgotPasswordForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") || "").trim();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!configured) {
      setError("Personal HQ is not configured yet. Please try again later.");
      return;
    }

    setError("");
    setPending(true);

    try {
      await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/update-password`,
      });
      setMessage("If an account matches that email, a reset link has been sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid gap-5" noValidate>
      <label className="grid gap-2 text-sm font-medium text-[var(--hq-cream)]">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="rounded-lg border border-[var(--hq-line)] bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-[#8cbde0]"
          placeholder="you@example.com"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-200">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-200">{message}</p>}
      <button disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--hq-cream)] px-4 font-semibold text-[var(--hq)] disabled:opacity-70">
        {pending && <LoaderCircle size={17} className="animate-spin" />}
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <Link href="/login" className="justify-self-center text-sm text-[#aed2ec] hover:text-white">
        Back to sign in
      </Link>
    </form>
  );
}
