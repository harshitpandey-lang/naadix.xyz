"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Building2, CalendarDays, FolderKanban, Goal, LayoutDashboard, NotebookPen, RotateCcw, Sparkles } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

export const workspaceItems = [
  { label: "Today", href: "/today", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Goals", href: "/goals", icon: Goal },
  { label: "Development", href: "/development", icon: Sparkles },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Learning", href: "/learning", icon: BookOpenText },
  { label: "Notes", href: "/notes", icon: NotebookPen },
  { label: "Review", href: "/review", icon: RotateCcw },
  { label: "NaadiX", href: "/naadix", icon: Building2 },
];

export function DashboardSidebar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  return <aside className="hq-sidebar">
    <Link href="/today" className="hq-sidebar-brand"><span className="signal-dot" /><span><strong>NAADIX</strong><small>FOUNDER SYSTEM</small></span></Link>
    <div className="hq-scroll hq-sidebar-scroll"><p className="hq-nav-label">PRIVATE NODE / MODULES</p><nav aria-label="Founder HQ">{workspaceItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} className="hq-nav-item" data-active={pathname === href || pathname.startsWith(`${href}/`) ? "true" : undefined}><Icon size={16} /><span>{label}</span></Link>)}</nav></div>
    <div className="hq-user"><span>HP</span><div><strong>{name}</strong><small>{role}</small></div></div><SignOutButton />
  </aside>;
}
