import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Development", robots: { index: false, follow: false } };

export default async function DevelopmentPage() {
  const { supabase } = await requireUser("/development");
  const [{ data: areas }, { data: skills }, { data: learning }] = await Promise.all([
    supabase.from("development_areas").select("id,name,current_focus,priority,status").order("priority", { ascending: false }),
    supabase.from("skills").select("id,name,current_level,target_level,status").order("created_at", { ascending: false }),
    supabase.from("learning_items").select("id,title,progress,status").eq("status", "active").order("updated_at", { ascending: false }).limit(5),
  ]);
  return <main className="hq-content"><p className="text-[10px] font-semibold tracking-[.16em] text-[var(--hq-accent)]">PRIVATE NODE / DEVELOPMENT</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.06em] text-[var(--hq-cream)]">Build the founder who can build NaadiX.</h1><p className="mt-3 max-w-xl text-sm text-[var(--hq-muted)]">A private workspace for skills, learning and deliberate practice. Nothing is pre-filled.</p>
    <section className="mt-10 grid gap-4 lg:grid-cols-2"><article className="hq-panel rounded-lg p-5"><p className="text-xs uppercase tracking-[.14em] text-[var(--hq-muted)]">Development areas</p>{areas?.length ? <ul className="mt-4 grid gap-3">{areas.map(a => <li key={a.id} className="border-t border-[var(--hq-line-soft)] pt-3"><strong>{a.name}</strong><span className="ml-3 text-xs text-[var(--hq-muted)]">Priority {a.priority} · {a.status}</span>{a.current_focus && <p className="mt-1 text-sm text-[var(--hq-muted)]">{a.current_focus}</p>}</li>)}</ul> : <p className="mt-4 text-sm text-[var(--hq-muted)]">No development areas yet. Add your first focus in Supabase after running the migration.</p>}</article>
    <article className="hq-panel rounded-lg p-5"><p className="text-xs uppercase tracking-[.14em] text-[var(--hq-muted)]">Skill matrix</p>{skills?.length ? <ul className="mt-4 grid gap-3">{skills.map(s => <li key={s.id} className="flex justify-between border-t border-[var(--hq-line-soft)] pt-3"><strong>{s.name}</strong><span className="text-xs text-[var(--hq-muted)]">{s.current_level}/5 → {s.target_level}/5 · {s.status}</span></li>)}</ul> : <p className="mt-4 text-sm text-[var(--hq-muted)]">No skills added yet.</p>}</article></section>
    <section className="mt-4 hq-panel rounded-lg p-5"><p className="text-xs uppercase tracking-[.14em] text-[var(--hq-muted)]">Learning now</p>{learning?.length ? <ul className="mt-4 grid gap-2">{learning.map(item => <li key={item.id}>{item.title} <span className="text-xs text-[var(--hq-muted)]">{item.progress}%</span></li>)}</ul> : <p className="mt-4 text-sm text-[var(--hq-muted)]">No learning items in progress.</p>}</section>
    <Link className="mt-8 inline-flex text-sm text-[var(--hq-accent)]" href="/dashboard">← Back to Today</Link></main>;
}
