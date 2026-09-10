"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { workspaceItems } from "./dashboard-sidebar";

const createActions = [["New Goal", "/goals?new=1"], ["New Project", "/projects?new=1"], ["New Note", "/notes?new=1"], ["New Learning Item", "/learning?new=1"]];

export function CommandPalette() {
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const open = () => { ref.current?.showModal(); setQuery(""); };
    const key = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); if (ref.current?.open) ref.current.close(); else open(); } };
    addEventListener("hq:command", open); addEventListener("keydown", key);
    return () => { removeEventListener("hq:command", open); removeEventListener("keydown", key); };
  }, []);
  const items = useMemo(() => [...workspaceItems.map((item) => [item.label, item.href]), ...createActions].filter(([label]) => label.toLowerCase().includes(query.toLowerCase())), [query]);
  return <dialog ref={ref} className="hq-command" onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}><div className="command-head"><Search size={17} /><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Go to a module or create…" aria-label="Search commands" /><button onClick={() => ref.current?.close()} aria-label="Close command palette"><X size={17} /></button></div><nav>{items.map(([label, href]) => <Link key={label} href={href} onClick={() => ref.current?.close()}><span>{label}</span><small>Open →</small></Link>)}</nav>{!items.length && <p className="command-empty">No matching command.</p>}<footer><span>Type to filter</span><span>Esc Close</span></footer></dialog>;
}
