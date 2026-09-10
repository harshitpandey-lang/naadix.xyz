"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Goal, LayoutDashboard, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import { workspaceItems } from "./dashboard-sidebar";

const primary = [
  { label: "Today", href: "/today", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Goals", href: "/goals", icon: Goal },
  { label: "Develop", href: "/development", icon: Sparkles },
];

export function DashboardMobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <><nav className="hq-mobile-nav" aria-label="Mobile Founder HQ">{primary.map(({ label, href, icon: Icon }) => <Link key={href} href={href} data-active={pathname === href ? "true" : undefined}><Icon size={18} /><span>{label}</span></Link>)}<button type="button" onClick={() => setOpen(true)} aria-label="Open all HQ modules"><Menu size={19} /><span>More</span></button></nav>{open && <div className="hq-drawer" role="dialog" aria-modal="true" aria-label="All modules" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}><div><div className="drawer-top"><strong>NAADIX / FOUNDER SYSTEM</strong><button onClick={() => setOpen(false)}>Close</button></div><nav>{workspaceItems.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)}><Icon size={17} />{label}</Link>)}</nav></div></div>}</>;
}
