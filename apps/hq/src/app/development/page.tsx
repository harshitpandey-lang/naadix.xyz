import type { Metadata } from "next";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
import { RecordManager, type WorkspaceRecord } from "@/src/components/workspace/record-manager";
import { requireUser } from "@/src/lib/require-user";

export const metadata: Metadata = { title: "Personal Development", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DevelopmentPage() {
  const { supabase, user } = await requireUser("/development");
  const [areas, skills, learning, milestones, reflections] = await Promise.all([
    supabase.from("development_areas").select("id,name,description,current_focus,priority,status,updated_at").order("priority", { ascending: false }),
    supabase.from("skills").select("id,name,development_area_id,current_level,target_level,priority,status,notes,last_reviewed,updated_at").order("priority", { ascending: false }),
    supabase.from("learning_items").select("id,title,item_type,status,source_url,notes,progress,skill_id,project_id,updated_at").order("updated_at", { ascending: false }),
    supabase.from("development_milestones").select("id,title,development_area_id,target_date,completed,updated_at").order("target_date"),
    supabase.from("development_reflections").select("id,body,reflected_on,updated_at").order("reflected_on", { ascending: false }),
  ]);
  const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Founder";
  const areaOptions = (areas.data ?? []).map((area) => ({ label: area.name, value: area.id }));
  const skillOptions = (skills.data ?? []).map((skill) => ({ label: skill.name, value: skill.id }));
  return <DashboardShell name={name} role="Founder, NaadiX"><main className="hq-content workspace-page"><header className="workspace-intro"><p>PRIVATE NODE / DEVELOPMENT</p><h1>Personal Development</h1><span>Build the founder who can build NaadiX.</span></header>
    <section className="development-stack">
      <div><h2>Current focus & development areas</h2><RecordManager table="development_areas" userId={user.id} records={(areas.data ?? []) as WorkspaceRecord[]} titleField="name" descriptionField="current_focus" emptyTitle="No development areas yet." emptyBody="Define a focus only when you choose it; HQ does not score or pre-populate you." loadError={areas.error?.message} fields={[{ name: "name", label: "Area", required: true }, { name: "current_focus", label: "Current focus", type: "textarea" }, { name: "priority", label: "Priority (1–5)", type: "number", min: 1, max: 5 }, { name: "status", label: "Status", type: "select", options: ["active", "paused", "complete"].map((value) => ({ label: value, value })) }]} /></div>
      <div><h2>Skill matrix</h2><RecordManager table="skills" userId={user.id} records={(skills.data ?? []) as WorkspaceRecord[]} titleField="name" descriptionField="notes" emptyTitle="No skills assessed." emptyBody="Add a professional capability and set your own current and target levels." loadError={skills.error?.message} fields={[{ name: "name", label: "Skill", required: true }, { name: "development_area_id", label: "Development area", type: "select", options: areaOptions }, { name: "current_level", label: "Current level (1–5)", type: "number", min: 1, max: 5 }, { name: "target_level", label: "Target level (1–5)", type: "number", min: 1, max: 5 }, { name: "priority", label: "Priority", type: "number", min: 1, max: 5 }, { name: "status", label: "Status", type: "select", options: ["building", "active", "learning", "paused"].map((value) => ({ label: value, value })) }, { name: "last_reviewed", label: "Last reviewed", type: "date" }, { name: "notes", label: "Notes", type: "textarea" }]} /></div>
      <div><h2>Learning activity</h2><RecordManager table="learning_items" userId={user.id} records={(learning.data ?? []) as WorkspaceRecord[]} descriptionField="notes" emptyTitle="No learning activity yet." emptyBody="Connect deliberate learning to a skill when it supports a real development goal." loadError={learning.error?.message} fields={[{ name: "title", label: "Learning item", required: true }, { name: "item_type", label: "Type", type: "select", options: ["course", "book", "paper", "article", "tutorial", "experiment", "topic"].map((value) => ({ label: value, value })) }, { name: "status", label: "Status", type: "select", options: ["active", "queue", "complete"].map((value) => ({ label: value, value })) }, { name: "skill_id", label: "Related skill", type: "select", options: skillOptions }, { name: "progress", label: "Progress %", type: "number", min: 0, max: 100 }, { name: "notes", label: "Notes", type: "textarea" }]} /></div>
      <div><h2>Roadmap & milestones</h2><RecordManager table="development_milestones" userId={user.id} records={(milestones.data ?? []) as WorkspaceRecord[]} statusField={null} emptyTitle="No milestones yet." emptyBody="Turn development intent into a dated, reviewable milestone." loadError={milestones.error?.message} fields={[{ name: "title", label: "Milestone", required: true }, { name: "development_area_id", label: "Development area", type: "select", options: areaOptions }, { name: "target_date", label: "Target date", type: "date" }, { name: "completed", label: "Already completed", type: "checkbox" }]} /></div>
      <div><h2>Reflection</h2><RecordManager table="development_reflections" userId={user.id} records={(reflections.data ?? []) as WorkspaceRecord[]} titleField="reflected_on" descriptionField="body" statusField={null} emptyTitle="No reflection yet." emptyBody="Record what changed, what worked, and what deserves attention next." loadError={reflections.error?.message} fields={[{ name: "reflected_on", label: "Date", type: "date", required: true }, { name: "body", label: "Reflection", type: "textarea", required: true }]} /></div>
    </section>
  </main></DashboardShell>;
}
