import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[var(--hq)] px-5 py-6 text-white sm:grid sm:place-items-center sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[var(--hq-panel)] shadow-2xl shadow-black/30 md:grid-cols-[1.05fr_.95fr]">
        <section className="border-b border-white/10 p-7 sm:p-10 md:border-r md:border-b-0">
          <Link
            href="/"
            className="text-sm font-black tracking-[.22em] text-[var(--hq-cream)]"
          >
            NAADIX
          </Link>
          <div className="mt-20 hidden max-w-sm md:block">
            <p className="text-xs font-semibold tracking-[.2em] text-[#8cbde0]">
              PRIVATE WORKSPACE
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-[-.05em] text-[var(--hq-cream)]">
              Built for quiet focus and a clearer view of what matters.
            </p>
          </div>
        </section>
        <section className="p-7 sm:p-10">
          <p className="text-xs font-semibold tracking-[.2em] text-[#8cbde0]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.06em] text-[var(--hq-cream)]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--hq-muted)]">{description}</p>
          {children}
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-[var(--hq-muted)] hover:text-white"
          >
            ← Back to public profile
          </Link>
        </section>
      </div>
    </main>
  );
}
