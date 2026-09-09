"use client";

import Link from "next/link";
import { getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectsBoardProps {
  projects: ProjectRecord[];
}

const columns = [
  {
    status: "ACTIVE",
    title: "Active",
  },
  {
    status: "PLANNED",
    title: "Planned",
  },
  {
    status: "COMPLETED",
    title: "Completed",
  },
  {
    status: "PAUSED",
    title: "Paused",
  },
];

export function ProjectsBoard({
  projects,
}: ProjectsBoardProps) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="grid min-w-[1000px] grid-cols-4 gap-3">
        {columns.map((column) => {
          const columnProjects = projects.filter(
            (project) => project.status === column.status,
          );

          return (
            <section
              key={column.status}
              className="min-h-[420px] rounded-lg border border-[#29383d] bg-[#0f1719]"
            >
              <div className="flex items-center justify-between border-b border-[#29383d] px-3 py-3">
                <div className="text-xs font-semibold text-[#91a6b2]">
                  {column.title}
                </div>

                <span className="rounded-md bg-[#202a2d] px-1.5 py-0.5 text-[10px] text-[#667b84]">
                  {columnProjects.length}
                </span>
              </div>

              <div className="space-y-2 p-2">
                {columnProjects.map((project) => {
                  const progress = Math.min(
                    100,
                    Math.max(0, Number(project.progress ?? 0)),
                  );

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.slug}`}
                      className="block rounded-md border border-[#29383d] bg-[#131d1f] p-3 transition hover:border-[#43545b] hover:bg-[#182124]"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#202a2d] text-[10px]">
                          ??
                        </span>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-[#e5ded3]">
                            {project.name}
                          </div>

                          <div className="mt-1 truncate text-[10px] text-[#53676f]">
                            {project.category} · {getStatusLabel(project.status)}
                          </div>
                        </div>
                      </div>

                      {project.short_description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#667b84]">
                          {project.short_description}
                        </p>
                      )}

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[10px] text-[#53676f]">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>

                        <div className="h-1 overflow-hidden rounded-full bg-[#202a2d]">
                          <div
                            className="h-full rounded-full bg-[#6d7f86]"
                            style={{
                              width: `${progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {columnProjects.length === 0 && (
                  <div className="rounded-md border border-dashed border-[#29383d] px-3 py-8 text-center text-xs text-[#53676f]">
                    No projects
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
