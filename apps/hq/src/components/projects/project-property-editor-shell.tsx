"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectPropertyEditor } from "./project-property-editor";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectPropertyEditorShellProps {
  project: ProjectRecord;
}

export function ProjectPropertyEditorShell({
  project,
}: ProjectPropertyEditorShellProps) {
  const router = useRouter();
  const [projectState, setProjectState] = useState<ProjectRecord>(project);

  const handleSave = async (updates: Partial<ProjectRecord>) => {
    try {
      const response = await fetch(`/api/projects/${project.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      const updated = await response.json();
      setProjectState(updated);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  };

  return <ProjectPropertyEditor project={projectState} onSave={handleSave} />;
}
