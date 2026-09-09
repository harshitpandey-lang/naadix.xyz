"use client";

import Link from "next/link";
import {
  BarChart3,
  BookOpenText,
  CalendarDays,
  ChevronDown,
  FolderKanban,
  GalleryVerticalEnd,
  Goal,
  LayoutDashboard,
  Map,
  Plus,
  Settings,
  Sparkles,
} from "lucide-react";
import { SignOutButton } from "./sign-out-button";

interface DashboardSidebarProps {
  name: string;
  role: string;
}

const workspaceItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarDays,
  },
  {
    label: "Goals",
    href: "/dashboard/goals",
    icon: Goal,
  },
  {
    label: "Development",
    href: "/development",
    icon: Sparkles,
  },
];

const workspaceSoon = [
  {
    label: "Analytics",
    icon: BarChart3,
  },
  {
    label: "Journal",
    icon: BookOpenText,
  },
  {
    label: "Trips",
    icon: Map,
  },
  {
    label: "Gallery",
    icon: GalleryVerticalEnd,
  },
  {
    label: "Projects",
    icon: FolderKanban,
  },
];

function SidebarLink({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <Link
      href={href}
      className="hq-nav-item"
      data-active={
        href === "/dashboard"
          ? "true"
          : undefined
      }
    >
      <Icon size={16} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ComingSoonItem({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <div
      className="hq-nav-item opacity-55"
      aria-disabled="true"
      title={`${label} is coming soon`}
    >
      <Icon size={16} strokeWidth={1.8} />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function DashboardSidebar({
  name,
  role,
}: DashboardSidebarProps) {
  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 border-r border-[var(--hq-line)] bg-[var(--hq-sidebar)] lg:flex lg:flex-col">
      {/* Workspace header */}
      <div className="flex h-14 items-center border-b border-[var(--hq-line-soft)] px-3">
        <Link
          href="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/[0.04]"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]">
            <Sparkles size={15} />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--hq-cream)]">
              NAADIX HQ
            </span>
            <span className="block truncate text-[10px] text-[var(--hq-muted)]">
              Personal workspace
            </span>
          </span>

          <ChevronDown
            size={14}
            className="ml-auto shrink-0 text-[var(--hq-muted)]"
          />
        </Link>
      </div>

      {/* Navigation */}
      <div className="hq-scroll min-h-0 flex-1 overflow-y-auto px-2 py-4">
        <div className="mb-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hq-muted)]">
            Workspace
          </p>

          <nav
            className="grid gap-0.5"
            aria-label="Primary workspace navigation"
          >
            {workspaceItems.map((item) => (
              <SidebarLink
                key={item.label}
                {...item}
              />
            ))}
          </nav>
        </div>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between px-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hq-muted)]">
              Personal
            </p>

            <button
              type="button"
              className="rounded p-1 text-[var(--hq-muted)] transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Add personal page"
              title="Add personal page"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="grid gap-0.5">
            {workspaceSoon.map((item) => (
              <ComingSoonItem
                key={item.label}
                {...item}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hq-muted)]">
            Workspace settings
          </p>

          <ComingSoonItem
            label="Settings"
            icon={Settings}
          />
        </div>
      </div>

      {/* User area */}
      <div className="border-t border-[var(--hq-line-soft)] p-2">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d9e4ea] text-[10px] font-bold text-[var(--navy)]">
            HP
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">
              {name}
            </p>
            <p className="truncate text-[10px] text-[var(--hq-muted)]">
              {role}
            </p>
          </div>
        </div>

        <SignOutButton />
      </div>
    </aside>
  );
}
