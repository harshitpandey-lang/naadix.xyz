import type { Metadata } from "next";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { RecordManager, type WorkspaceRecord } from "@/src/components/workspace/record-manager";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Learning", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const { supabase, user } = await requireUser("/learning");
  const [learning, skills, projects] = await Promise.all([
    supabase.from("learning_items").select("id,title,item_type,status,source_url,notes,progress,skill_id,project_id,updated_at").order("updated_at", { ascending: false }),
    supabase.from("skills").select("id,name").order("name"),
    supabase.from("projects").select("id,name").order("name"),
  ]);
  const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Founder";
  const loadError = [learning.error, skills.error, projects.error].filter(Boolean).map((error) => error?.message).join(" ") || undefined;
  return <DashboardShell name={name} role="Founder, NaadiX"><main className="hq-content workspace-page"><header className="workspace-intro"><p>PRIVATE NODE / LEARNING</p><h1>Learning</h1><span>A deliberate queue for knowledge that supports the work.</span></header><RecordManager table="learning_items" userId={user.id} records={(learning.data ?? []) as WorkspaceRecord[]} descriptionField="notes" emptyTitle="The learning queue is empty." emptyBody="Add a course, book, paper, article, tutorial, experiment, or topic when it earns your attention." loadError={loadError} fields={[
    { name: "title", label: "Title", required: true },
    { name: "item_type", label: "Type", type: "select", required: true, options: ["course", "book", "paper", "article", "tutorial", "experiment", "topic"].map((value) => ({ label: value, value })) },
    { name: "status", label: "Status", type: "select", required: true, options: ["active", "queue", "complete"].map((value) => ({ label: value, value })) },
    { name: "skill_id", label: "Related skill", type: "select", options: (skills.data ?? []).map((skill) => ({ label: skill.name, value: skill.id })) },
    { name: "project_id", label: "Related project", type: "select", options: (projects.data ?? []).map((project) => ({ label: project.name, value: project.id })) },
    { name: "source_url", label: "Source", type: "url" },
    { name: "progress", label: "Progress %", type: "number", min: 0, max: 100 },
    { name: "notes", label: "Notes", type: "textarea" },
  ]} /></main></DashboardShell>;
}
