import type { Metadata } from "next";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { ReviewForm } from "@/src/components/review/review-form";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Weekly Review", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function ReviewPage() {
  const { supabase, user } = await requireUser("/review"); const now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); const weekOf = monday.toISOString().slice(0, 10); const start = monday.toISOString();
  const [goals, learning, projects, notes, review] = await Promise.all([
    supabase.from("goals").select("id,completed").gte("updated_at", start), supabase.from("learning_items").select("id,status").gte("updated_at", start), supabase.from("projects").select("id,status").gte("updated_at", start), supabase.from("notes").select("id").gte("created_at", start), supabase.from("weekly_reviews").select("*").eq("week_of", weekOf).maybeSingle(),
  ]);
  const allGoals = goals.data ?? []; const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Founder";
  return <DashboardShell name={name} role="Founder, NaadiX"><main className="hq-content workspace-page"><header className="workspace-intro"><p>PRIVATE NODE / REVIEW</p><h1>Weekly Review</h1><span>Close the loop on the work, learning, and decisions of this week.</span></header><section className="review-derived" aria-label="This week from stored data"><article><strong>{allGoals.filter((g) => g.completed).length}</strong><span>Goals completed</span></article><article><strong>{allGoals.filter((g) => !g.completed).length}</strong><span>Goals unfinished</span></article><article><strong>{learning.data?.length ?? 0}</strong><span>Learning changes</span></article><article><strong>{projects.data?.length ?? 0}</strong><span>Project changes</span></article><article><strong>{notes.data?.length ?? 0}</strong><span>Notes created</span></article></section><ReviewForm userId={user.id} weekOf={weekOf} existing={review.data ?? undefined} /></main></DashboardShell>;
}
