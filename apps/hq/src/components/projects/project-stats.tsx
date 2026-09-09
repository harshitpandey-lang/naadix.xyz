"use client";

import { useMemo } from "react";

interface ProjectStatsProps {
  projects: Array<{ status?: string | null; updated_at?: string | null }>;
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) => p.status === "ACTIVE").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      paused: projects.filter((p) => p.status === "PAUSED").length,
      planned: projects.filter((p) => p.status === "PLANNED").length,
      recentlyUpdated: projects.filter((p) => Boolean(p.updated_at)).length,
    }),
    [projects],
  );

  const statItems = [
    { label: "TOTAL", value: stats.total, color: "text-[var(--hq-cream)]" },
    { label: "ACTIVE", value: stats.active, color: "text-green-400" },
    {
      label: "COMPLETED",
      value: stats.completed,
      color: "text-blue-400",
    },
    { label: "PLANNED", value: stats.planned, color: "text-slate-400" },
    {
      label: "RECENTLY UPDATED",
      value: stats.recentlyUpdated,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {statItems.map((item) => (
        <div key={item.label} className="bg-[var(--hq-panel)] border border-[var(--hq-line)] rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-[var(--hq-muted)] mb-2">
            {item.label}
          </p>
          <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}
