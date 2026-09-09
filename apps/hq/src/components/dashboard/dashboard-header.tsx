"use client";

import {
  Bell,
  ChevronRight,
  Command,
  Plus,
  Search,
} from "lucide-react";
import { SignOutButton } from "./sign-out-button";

interface DashboardHeaderProps {
  name: string;
}

export function DashboardHeader({
  name,
}: DashboardHeaderProps) {
  const now = new Date();

  const greeting =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
        ? "afternoon"
        : "evening";

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const firstName = name.trim().split(" ")[0] || name;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--hq-line)] bg-[rgba(15,20,22,0.92)] backdrop-blur-xl">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="hidden text-xs text-[var(--hq-muted)] sm:inline">
            NAADIX HQ
          </span>

          <ChevronRight
            size={13}
            className="hidden text-[var(--hq-muted)] sm:block"
          />

          <span className="truncate text-sm font-medium text-[var(--hq-cream)]">
            Overview
          </span>
        </div>

        {/* Utilities */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="hidden h-8 items-center gap-2 rounded-md border border-[var(--hq-line)] bg-white/[0.025] px-2.5 text-xs text-[var(--hq-muted)] transition hover:border-[#3b4b50] hover:bg-white/[0.05] hover:text-white md:flex"
            aria-label="Search workspace"
            title="Search workspace"
          >
            <Search size={14} />
            <span>Search</span>
            <span className="ml-2 flex items-center gap-0.5 rounded border border-[var(--hq-line)] px-1 py-0.5 text-[9px]">
              <Command size={9} />
              K
            </span>
          </button>

          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-[var(--hq-muted)] transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Create new item"
            title="Create new item"
          >
            <Plus size={17} />
          </button>

          <button
            type="button"
            className="relative grid h-8 w-8 place-items-center rounded-md text-[var(--hq-muted)] transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={17} />

            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--hq-accent)]" />
          </button>

          <div className="ml-1 hidden sm:block">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Page context */}
      <div className="border-t border-[var(--hq-line-soft)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hq-accent)]">
              Personal workspace
            </p>

            <h1 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[var(--hq-cream)] sm:text-2xl">
              Good {greeting}, {firstName}.
            </h1>
          </div>

          <p className="text-xs text-[var(--hq-muted)]">
            {date}
          </p>
        </div>
      </div>
    </header>
  );
}
