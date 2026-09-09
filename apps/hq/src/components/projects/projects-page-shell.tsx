"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

interface ProjectsPageShellProps {
  children: React.ReactNode;
}

export function ProjectsPageShell({ children }: ProjectsPageShellProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-xs text-[#53676f]">
          Naadix HQ / Projects
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>

          <form action="/api/projects/ceo/logout" method="POST">
            <button
              type="submit"
              className="rounded-md px-2 py-1.5 text-xs text-[#667b84] transition hover:bg-[#182124] hover:text-[#f2eadf]"
            >
              Logout
            </button>
          </form>
        </div>
      </div>

      {children}

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
