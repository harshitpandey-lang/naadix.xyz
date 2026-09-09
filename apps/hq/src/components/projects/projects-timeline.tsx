"use client";

import Link from "next/link";
import { getStatusChipClass, getStatusLabel } from "@/src/lib/projects/status-utils";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectsTimelineProps {
  projects: ProjectRecord[];
}

function formatDate(date?: string | null) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ProjectsTimeline({
  projects,
}: ProjectsTimelineProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#29383d] bg-[#0f1719]">
      <div className="min-w-[950px]">
        <div className="grid grid-cols-[260px_170px_120px_1fr] border-b border-[#29383d] bg-[#131d1f] px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#53676f]">
          <div>Project</div>
          <div>Category</div>
          <div>Status</div>
          <div>Timeline</div>
        </div>

        {projects.map((project) => {
          const progress = Math.min(
            100,
            Math.max(0, Number(project.progress ?? 0)),
          );

          return (
            <div
              key={project.id}
              className="grid grid-cols-[260px_170px_120px_1fr] items-center border-b border-[#202a2d] px-4 py-4 transition hover:bg-[#151f21]"
            >
              <Link
                href={`/projects/${project.slug}`}
                className="min-w-0 pr-6"
              >
                <div className="truncate text-sm font-medium text-[#e5ded3]">
                  {project.name}
                </div>

                <div className="mt-1 text-[10px] text-[#53676f]">
                  Updated {formatDate(project.updated_at)}
                </div>
              </Link>

              <div className="truncate pr-4 text-xs text-[#667b84]">
                {project.category}
              </div>

              <div>
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${getStatusChipClass(
                    project.status,
                  )}`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </div>

              <div className="relative">
                <div className="absolute left-0 right-0 top-1/2 h-px bg-[#29383d]" />

                <div
                  className="relative h-7 rounded-md bg-[#202a2d]"
                  style={{
                    width: `${Math.max(progress, 8)}%`,
                  }}
                >
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 truncate text-[10px] text-[#91a6b2]">
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="px-4 py-10 text-center text-xs text-[#53676f]">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}
