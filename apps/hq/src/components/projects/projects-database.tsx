"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getStatusChipClass,
  getStatusDotClass,
  getStatusLabel,
} from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";
import { ProjectRowMenu } from "./project-row-menu";

interface ProjectsDatabaseProps {
  projects: ProjectRecord[];
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectsDatabase({
  projects,
}: ProjectsDatabaseProps) {
  const router = useRouter();


  const handleDuplicate = async (slug: string) => {
    try {
      const response = await fetch(`/api/projects/${slug}/duplicate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to duplicate");
      router.refresh();
    } catch (error) {
      console.error("Duplicate failed:", error);
    }
  };

  const handleDelete = async (slug: string) => {
    try {
      const response = await fetch(`/api/projects/${slug}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleArchive = async (slug: string) => {
    try {
      const response = await fetch(`/api/projects/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      if (!response.ok) throw new Error("Failed to archive");
      router.refresh();
    } catch (error) {
      console.error("Archive failed:", error);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-md border border-[#29383d] bg-[#0f1719] px-4 py-8 text-center text-sm text-[#667b84]">
        No projects match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-md border border-[#29383d] bg-[#0f1719] md:block">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[minmax(230px,1.2fr)_140px_180px_130px_220px_130px_40px] border-b border-[#29383d] bg-[#131d1f] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
            <div>Project</div>
            <div>Status</div>
            <div>Category</div>
            <div>Domain</div>
            <div>Technologies</div>
            <div>Last Updated</div>
            <div></div>
          </div>

          {projects.map((project) => {
            const technologies = Array.isArray(project.technologies)
              ? project.technologies.filter(
                  (value): value is string => Boolean(value && value.trim()),
                )
              : [];

            return (
              <div
                key={project.id}
                className="grid min-w-[1200px] grid-cols-[minmax(230px,1.2fr)_140px_180px_130px_220px_130px_40px] items-center border-b border-[#202a2d] px-4 py-3.5 text-sm transition hover:bg-[#151f21]"
              >
                <div className="min-w-0 pr-4">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="font-medium text-[#e5ded3] transition hover:text-[#f2eadf] hover:underline"
                  >
                    {project.name}
                  </Link>

                  {project.short_description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667b84]">
                      {project.short_description}
                    </p>
                  )}
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(
                      project.status,
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                        project.status,
                      )}`}
                      aria-hidden="true"
                    />
                    <span>{getStatusLabel(project.status)}</span>
                  </span>
                </div>

                <div className="pr-3 text-xs text-[#667b84]">
                  {project.category || "—"}
                </div>

                <div className="pr-3 text-xs text-[#667b84]">
                  {typeof project.domain === "string" && project.domain.trim().length > 0
                    ? project.domain
                    : "—"}
                </div>

                <div className="text-xs text-[#667b84]">
                  {technologies.length > 0 ? technologies.join(", ") : "—"}
                </div>

                <div className="text-xs text-[#53676f]">
                  {formatDate(project.updated_at)}
                </div>

                <div className="flex justify-end">
                  <ProjectRowMenu
                    project={project}
                    onDuplicate={() => handleDuplicate(project.slug)}
                    onDelete={() => handleDelete(project.slug)}
                    onArchive={() => handleArchive(project.slug)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {projects.map((project) => {
          const technologies = Array.isArray(project.technologies)
            ? project.technologies.filter(
                (value): value is string => Boolean(value && value.trim()),
              )
            : [];

          return (
            <article
              key={project.id}
              className="rounded-md border border-[#29383d] bg-[#0f1719] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="text-sm font-medium text-[#e5ded3] underline-offset-2 hover:underline"
                  >
                    {project.name}
                  </Link>

                  {project.short_description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667b84]">
                      {project.short_description}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(
                      project.status,
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(project.status)}`}
                      aria-hidden="true"
                    />
                    <span>{getStatusLabel(project.status)}</span>
                  </span>

                  <ProjectRowMenu
                    project={project}
                    onDuplicate={() => handleDuplicate(project.slug)}
                    onDelete={() => handleDelete(project.slug)}
                    onArchive={() => handleArchive(project.slug)}
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#667b84]">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#53676f]">Category</div>
                  <div className="mt-1">{project.category || "—"}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#53676f]">Domain</div>
                  <div className="mt-1">
                    {typeof project.domain === "string" && project.domain.trim().length > 0
                      ? project.domain
                      : "—"}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#53676f]">Technologies</div>
                  <div className="mt-1 line-clamp-2">
                    {technologies.length > 0 ? technologies.join(", ") : "—"}
                  </div>
                </div>

                <div className="col-span-2 text-[#53676f]">
                  Last updated {formatDate(project.updated_at)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
