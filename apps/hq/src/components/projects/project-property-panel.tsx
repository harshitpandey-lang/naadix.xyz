import Link from "next/link";
import { getStatusChipClass, getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

function safeDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function compactList(values?: string[] | null) {
  if (!Array.isArray(values) || values.length === 0) {
    return "—";
  }

  return values.filter(Boolean).join(" · ");
}

export function ProjectPropertyPanel({ project }: { project: ProjectRecord }) {
  const properties = [
    { label: "Status", value: <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(project.status)}`}>{getStatusLabel(project.status)}</span> },
    { label: "Category", value: project.category || "—" },
    { label: "Domain", value: project.domain || "—" },
    { label: "Technologies", value: compactList(project.technologies) },
    { label: "Skills", value: compactList(project.skills) },
    { label: "Start Date", value: safeDate(project.created_at) },
    { label: "Last Updated", value: safeDate(project.updated_at) },
    { label: "My Role", value: project.my_role || "—" },
    { label: "GitHub", value: project.github_url ? <Link href={project.github_url} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">{project.github_url}</Link> : "—" },
    { label: "Live Demo", value: project.live_demo_url ? <Link href={project.live_demo_url} target="_blank" rel="noreferrer" className="text-[#91a6b2] underline underline-offset-2 hover:text-[#c8dce5]">{project.live_demo_url}</Link> : "—" },
  ];

  return (
    <section className="mt-8 rounded-md border border-[#29383d] bg-[#0f1719] p-4">
      <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#91a6b2]">Properties</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <div key={property.label} className="rounded-md border border-[#202a2d] bg-[#131d1f] px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-[0.16em] text-[#53676f]">{property.label}</div>
            <div className="mt-1.5 text-sm text-[#e5ded3]">{property.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
