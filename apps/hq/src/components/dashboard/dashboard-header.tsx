"use client";

import Link from "next/link";
import { Command, Plus, Search } from "lucide-react";

export function DashboardHeader({ name }: { name: string }) {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening";
  const date = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  return <header className="hq-header"><div className="hq-header-row"><span>NAADIX / FOUNDER HQ</span><div><button type="button" onClick={() => dispatchEvent(new Event("hq:command"))}><Search size={14} /> Search <kbd><Command size={10} />K</kbd></button><Link href="/notes?new=1"><Plus size={15} /> Capture</Link></div></div><div className="hq-greeting"><div><p>PRIVATE NODE / LIVE</p><h1>Good {greeting}, {name.split(" ")[0]}.</h1></div><time dateTime={now.toISOString()}>{date}</time></div></header>;
}
