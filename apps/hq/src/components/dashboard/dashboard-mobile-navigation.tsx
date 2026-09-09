import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export function DashboardMobileNavigation() {
  return (
    <nav className="flex items-center justify-between gap-3 border-b border-[var(--hq-line)] px-5 py-3 lg:hidden" aria-label="Dashboard navigation">
      <Link href="/dashboard" className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white">
        <LayoutDashboard size={16} />
        Overview
      </Link>
      <span className="text-xs text-[var(--hq-muted)]">More sections coming soon</span>
      <div className="sm:hidden"><SignOutButton /></div>
    </nav>
  );
}
