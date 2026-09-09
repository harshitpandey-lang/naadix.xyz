"use client";

import Link from "next/link";

export function ProjectsMobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[#29383d] bg-[#11191b]/95 px-4 py-3 backdrop-blur md:hidden">
      <Link
        href="/projects"
        className="flex items-center gap-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#202a2d] text-xs font-semibold text-[#f2eadf]">
          N
        </span>

        <span className="text-sm font-semibold text-[#f2eadf]">
          Naadix HQ
        </span>
      </Link>

      <Link
        href="/"
        className="rounded-md px-2 py-1.5 text-xs text-[#667b84] transition hover:bg-[#182124] hover:text-[#91a6b2]"
      >
        Home
      </Link>
    </header>
  );
}
