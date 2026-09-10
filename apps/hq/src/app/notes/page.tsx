import type { Metadata } from "next";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { RecordManager, type WorkspaceRecord } from "@/src/components/workspace/record-manager";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Notes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const { supabase, user } = await requireUser("/notes");
  const [notes, projects, goals] = await Promise.all([
    supabase.from("notes").select("id,title,body,note_type,tags,pinned,project_id,goal_id,updated_at").order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
    supabase.from("projects").select("id,name").order("name"),
    supabase.from("goals").select("id,title").order("title"),
  ]);
  const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Founder";
  const loadError = [notes.error, projects.error, goals.error].filter(Boolean).map((error) => error?.message).join(" ") || undefined;
  return <DashboardShell name={name} role="Founder, NaadiX"><main className="hq-content workspace-page"><header className="workspace-intro"><p>PRIVATE NODE / NOTES</p><h1>Notes</h1><span>Capture quickly. Retrieve by type, tag, project, goal, or search.</span></header><RecordManager table="notes" userId={user.id} records={(notes.data ?? []) as WorkspaceRecord[]} descriptionField="body" statusField="note_type" emptyTitle="No notes captured." emptyBody="Write the first private idea, meeting note, research note, strategy, or learning record." loadError={loadError} fields={[
    { name: "title", label: "Title", required: true },
    { name: "note_type", label: "Type", type: "select", required: true, options: ["idea", "meeting", "research", "strategy", "learning", "general"].map((value) => ({ label: value, value })) },
    { name: "tags", label: "Tags", type: "tags", placeholder: "Comma separated" },
    { name: "project_id", label: "Related project", type: "select", options: (projects.data ?? []).map((project) => ({ label: project.name, value: project.id })) },
    { name: "goal_id", label: "Related goal", type: "select", options: (goals.data ?? []).map((goal) => ({ label: goal.title, value: goal.id })) },
    { name: "pinned", label: "Pin this note", type: "checkbox" },
    { name: "body", label: "Note", type: "textarea", required: true },
  ]} /></main></DashboardShell>;
}
