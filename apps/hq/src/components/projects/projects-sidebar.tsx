"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProjectsSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/projects") {
      return pathname === "/projects" || pathname.startsWith("/projects/");
    }

    return pathname === path;
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition ${
      active
        ? "bg-[#202a2d] text-[#f2eadf]"
        : "text-[#667b84] hover:bg-[#182124] hover:text-[#91a6b2]"
    }`;

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-60 border-r border-[#29383d] bg-[#11191b] text-[#91a6b2] md:flex md:flex-col">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#202a2d] text-sm">
            N
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[#f2eadf]">
              Naadix HQ
            </div>

            <div className="truncate text-[10px] text-[#53676f]">
              Personal workspace
            </div>
          </div>

          <span className="ml-auto text-[10px] text-[#53676f]">
            ?
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-0.5">
          <Link href="/" className={linkClass(isActive("/"))}>
            <span className="w-4 text-center text-xs">¦</span>
            <span>Home</span>
          </Link>

          <Link
            href="/dashboard"
            className={linkClass(isActive("/dashboard"))}
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="px-3 pb-2 pt-7 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          Workspace
        </div>

        <div className="space-y-0.5">
          <Link
            href="/projects"
            className={linkClass(isActive("/projects"))}
          >
            <span className="w-4 text-center text-xs">??</span>
            <span>Projects</span>
          </Link>

          <Link
            href="/dashboard/calendar"
            className={linkClass(isActive("/dashboard/calendar"))}
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>Calendar</span>
          </Link>
        </div>

        <div className="px-3 pb-2 pt-7 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          Project Views
        </div>

        <div className="space-y-0.5">
          <Link
            href="/projects"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#667b84] transition hover:bg-[#182124] hover:text-[#91a6b2]"
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>All Projects</span>
          </Link>

          <Link
            href="/projects?status=ACTIVE"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#667b84] transition hover:bg-[#182124] hover:text-[#91a6b2]"
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>Active</span>
          </Link>

          <Link
            href="/projects?status=COMPLETED"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#667b84] transition hover:bg-[#182124] hover:text-[#91a6b2]"
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>Completed</span>
          </Link>

          <Link
            href="/projects?status=PLANNED"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm text-[#667b84] transition hover:bg-[#182124] hover:text-[#91a6b2]"
          >
            <span className="w-4 text-center text-xs">?</span>
            <span>Planned</span>
          </Link>
        </div>
      </nav>

      <div className="border-t border-[#29383d] px-3 py-3">
        <div className="rounded-md px-3 py-2 text-xs text-[#53676f]">
          Naadix HQ
        </div>
      </div>
    </aside>
  );
}
