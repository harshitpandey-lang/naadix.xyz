"use client";

import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/src/lib/supabase/client";

type LoginFormProps = { nextPath: string; configured: boolean };

export function LoginForm({ nextPath, configured }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email) return setError("Please enter your email.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    if (!configured) return setError("Personal HQ is not configured yet. Please try again later.");

    setError("");
    setPending(true);

    try {
      const { error: authError } = await createClient().auth.signInWithPassword({
        email,
        password,
      });

      if (authError) setError("Invalid email or password.");
      else router.replace(nextPath);
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
        <input name="email" type="email" autoComplete="email" className="rounded-lg border border-[var(--hq-line)] bg-white/5 px-4 py-3 text-base text-white outline-none transition placeholder:text-[var(--hq-muted)] focus:border-[#8cbde0]" placeholder="you@example.com" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[var(--hq-cream)]">
        Password
        <span className="relative">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="w-full rounded-lg border border-[var(--hq-line)] bg-white/5 px-4 py-3 pr-12 text-base text-white outline-none transition placeholder:text-[var(--hq-muted)] focus:border-[#8cbde0]" placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[var(--hq-muted)] hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {error && <p role="alert" className="rounded-md border border-red-300/30 bg-red-300/10 px-3 py-2 text-sm text-red-100">{error}</p>}
      <button disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--hq-cream)] px-4 font-semibold text-[var(--hq)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70">
        {pending && <LoaderCircle size={17} className="animate-spin" />}
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <Link href="/forgot-password" className="justify-self-center text-sm text-[#aed2ec] hover:text-white">
        Forgot password?
      </Link>
    </form>
  );
}
