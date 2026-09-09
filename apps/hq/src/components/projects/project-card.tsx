"use client";

import Link from "next/link";

interface ProjectCardProps {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string | null;
  progress: number | null;
  short_description: string | null;
  updated_at: string;
}

export function ProjectCard({
  slug,
  name,
  category,
  status,
  progress,
  short_description,
  updated_at,
}: ProjectCardProps) {
  const statusColors: Record<string, string> = {
    PLANNED: "bg-slate-100 text-slate-700",
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    ARCHIVED: "bg-gray-100 text-gray-700",
  };

  const statusDisplay = status || "Not specified";
  const statusColor = status ? (statusColors[status] || "bg-gray-100 text-gray-700") : "bg-gray-200 text-gray-600";

  return (
    <Link href={`/projects/${slug}`}>
      <div className="group border-b border-[var(--hq-line)] py-6 hover:bg-[var(--hq-panel)] px-6 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[var(--hq-cream)] group-hover:text-white transition">
              {name}
            </h3>
            <p className="text-sm text-[var(--hq-muted)] mt-1">
              {category}
            </p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${statusColor}`}>
            {statusDisplay}
          </div>
        </div>

        {short_description && (
          <p className="text-sm text-[var(--hq-muted)] mt-2 line-clamp-2">
            {short_description}
          </p>
        )}

        <div className="flex items-center justify-between mt-4 text-xs text-[var(--hq-muted)]">
          {progress !== null && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 bg-[var(--hq-line)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span>{progress}%</span>
            </div>
          )}
          <span className="ml-auto">
            {new Date(updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
