"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

const prompts = [["went_well", "What went well?"], ["moved_forward", "What moved NaadiX forward?"], ["slowed_down", "What slowed me down?"], ["learned", "What did I learn?"], ["stop_doing", "What should I stop doing?"], ["priorities_next_week", "What are the top priorities next week?"]];
export function ReviewForm({ userId, weekOf, existing }: { userId: string; weekOf: string; existing?: Record<string, string | null> }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); const data = Object.fromEntries(new FormData(event.currentTarget)); const { error } = await createClient().from("weekly_reviews").upsert({ user_id: userId, week_of: weekOf, ...data }, { onConflict: "user_id,week_of" }); setPending(false); setMessage(error ? error.message : "Weekly review saved privately."); if (!error) router.refresh(); }
  return <form className="review-form" onSubmit={save}>{prompts.map(([name, label]) => <label key={name}><span>{label}</span><textarea name={name} rows={3} defaultValue={existing?.[name] ?? ""} /></label>)}<button className="hq-action" disabled={pending}>{pending ? "Saving…" : "Save weekly review"}</button>{message && <p role="status">{message}</p>}</form>;
}
