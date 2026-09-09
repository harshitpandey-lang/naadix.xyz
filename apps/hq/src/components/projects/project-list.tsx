"use client";

import { ProjectCard } from "./project-card";

interface Project {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  progress: number | null;
  short_description: string | null;
  updated_at: string;
}

interface ProjectListProps {
  projects: Project[];
  isLoading?: boolean;
}

export function ProjectList({ projects, isLoading }: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-[var(--hq-panel)] rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--hq-muted)]">No projects found</p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--hq-line)] rounded">
      {projects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </div>
  );
}
