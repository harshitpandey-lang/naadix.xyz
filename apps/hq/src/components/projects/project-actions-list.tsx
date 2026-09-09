"use client";

import { useState } from "react";

interface ProjectAction {
  id: string;
  task: string;
  owner?: string;
  due_date?: string;
  status: string;
}

interface ProjectActionsListProps {
  projectSlug: string;
  actions: ProjectAction[];
  onUpdate?: () => void;
}

export function ProjectActionsList({
  projectSlug,
  actions: initialActions,
  onUpdate,
}: ProjectActionsListProps) {
  const [actions, setActions] = useState(initialActions);

  const handleStatusChange = async (
    actionId: string,
    newStatus: string,
  ) => {
    try {
      const response = await fetch(
        `/api/projects/${projectSlug}/actions/${actionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) throw new Error("Failed to update action");

      setActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a)),
      );

      onUpdate?.();
    } catch (error) {
      console.error("Error updating action:", error);
      alert("Failed to update action");
    }
  };

  const handleDelete = async (actionId: string) => {
    if (!confirm("Delete this action?")) return;

    try {
      const response = await fetch(
        `/api/projects/${projectSlug}/actions/${actionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) throw new Error("Failed to delete action");

      setActions((prev) => prev.filter((a) => a.id !== actionId));
      onUpdate?.();
    } catch (error) {
      console.error("Error deleting action:", error);
      alert("Failed to delete action");
    }
  };

  const statusColors: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    DONE: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--hq-line)]">
              <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--hq-muted)]">
                Task
              </th>
              <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--hq-muted)]">
                Owner
              </th>
              <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--hq-muted)]">
                Due Date
              </th>
              <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-[var(--hq-muted)]">
                Status
              </th>
              <th className="text-right py-3 px-4 text-xs uppercase tracking-wider text-[var(--hq-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => (
              <tr
                key={action.id}
                className="border-b border-[var(--hq-line)] hover:bg-[var(--hq-panel)]"
              >
                <td className="py-3 px-4 text-[var(--hq-cream)]">{action.task}</td>
                <td className="py-3 px-4 text-[var(--hq-muted)]">
                  {action.owner || "-"}
                </td>
                <td className="py-3 px-4 text-[var(--hq-muted)]">
                  {action.due_date
                    ? new Date(action.due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="py-3 px-4">
                  <select
                    value={action.status}
                    onChange={(e) =>
                      handleStatusChange(action.id, e.target.value)
                    }
                    className={`px-2 py-1 rounded text-xs font-medium cursor-pointer border-0 ${statusColors[action.status] || statusColors.TODO}`}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(action.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actions.length === 0 && (
        <p className="text-center text-[var(--hq-muted)] py-4">No actions yet</p>
      )}
    </div>
  );
}
