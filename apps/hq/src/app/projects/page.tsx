import type { Metadata } from "next";
import { WorkspacePage } from "@/src/components/workspace/workspace-page";

export const metadata: Metadata = { title: "Projects", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function ProjectsPage() { return <WorkspacePage route="/projects" eyebrow="PRIVATE NODE / PROJECTS" title="Projects" description="Plan the work, track the active edge, and preserve what was learned." table="projects" select="id,name,short_description,category,status,priority,progress,deadline,github_url,related_goal_ids,notes,updated_at" titleField="name" descriptionField="short_description" emptyTitle="No projects yet." emptyBody="Create a project when there is real work to track. Nothing is pre-populated." fields={[
  { name: "name", label: "Name", required: true }, { name: "short_description", label: "Description", type: "textarea" },
  { name: "category", label: "Category", type: "select", required: true, options: ["Company","Client","Internal tools","Research","AI & Automation"].map((value) => ({ label: value, value })) },
  { name: "priority", label: "Priority (1–5)", type: "number", min: 1, max: 5 },
  { name: "status", label: "Status", type: "select", required: true, options: ["PLANNED","ACTIVE","PAUSED","COMPLETED","ARCHIVED"].map((value) => ({ label: value, value })) },
  { name: "progress", label: "Progress %", type: "number", min: 0, max: 100 }, { name: "deadline", label: "Deadline", type: "date" },
  { name: "github_url", label: "Primary link", type: "url", placeholder: "https://" }, { name: "related_goal_ids", label: "Related goal IDs", type: "tags", placeholder: "Comma separated UUIDs" },
  { name: "notes", label: "Notes", type: "textarea" },
]} />; }
