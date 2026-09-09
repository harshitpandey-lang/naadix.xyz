"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { ProjectRecord } from "@/src/lib/projects/types";

interface ProjectAction {
  id: string;
  project_id: string;
  task: string;
  owner?: string | null;
  due_date?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  position: number;
  created_at: string;
  updated_at: string;
}

interface ProjectActionsManagerProps {
  project: ProjectRecord;
  actions: ProjectAction[];
  onActionsChange?: () => void;
}

export function ProjectActionsManager({
  project,
  actions,
  onActionsChange,
}: ProjectActionsManagerProps) {
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newActionData, setNewActionData] = useState({
    task: "",
    owner: "",
    due_date: "",
  });

  const handleAddAction = async () => {
    if (!newActionData.task.trim()) {
      setError("Task is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${project.slug}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task: newActionData.task,
            owner: newActionData.owner || null,
            due_date: newActionData.due_date || null,
            status: "TODO",
            position: actions.length,
          }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add action");
      }

      // Reset form
      setNewActionData({
        task: "",
        owner: "",
        due_date: "",
      });
      setIsAddingAction(false);

      // Refresh actions
      onActionsChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (
    actionId: string,
    currentStatus: string,
  ) => {
    const statusMap: Record<string, string> = {
      TODO: "IN_PROGRESS",
      IN_PROGRESS: "DONE",
      DONE: "TODO",
    };

    const nextStatus = statusMap[currentStatus] || "TODO";

    try {
      const response = await fetch(
        `/api/projects/${project.slug}/actions/${actionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update action");
      }

      onActionsChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update action",
      );
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm("Delete this action?")) return;

    try {
      const response = await fetch(
        `/api/projects/${project.slug}/actions/${actionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete action");
      }

      onActionsChange?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete action",
      );
    }
  };

  // Group actions by status
  const actionsByStatus: Record<string, ProjectAction[]> = {
    TODO: actions.filter((a) => a.status === "TODO"),
    IN_PROGRESS: actions.filter((a) => a.status === "IN_PROGRESS"),
    DONE: actions.filter((a) => a.status === "DONE"),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "TODO":
        return "text-[var(--hq-muted)]";
      case "IN_PROGRESS":
        return "text-yellow-400";
      case "DONE":
        return "text-green-400";
      default:
        return "text-[var(--hq-muted)]";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-[var(--hq-cream)]">
          Next Steps & Actions
        </h3>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Actions by Status */}
        <div className="grid gap-4 lg:grid-cols-3">
          {["TODO", "IN_PROGRESS", "DONE"].map((status) => {
            const statusActions = actionsByStatus[status] || [];
            const statusLabels: Record<string, string> = {
              TODO: "To Do",
              IN_PROGRESS: "In Progress",
              DONE: "Completed",
            };

            return (
              <div
                key={status}
                className="rounded-md border border-[var(--hq-line)] bg-[var(--hq-panel)] p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      status === "TODO"
                        ? "bg-[var(--hq-muted)]"
                        : status === "IN_PROGRESS"
                          ? "bg-yellow-400"
                          : "bg-green-400"
                    }`}
                  />
                  <h4 className="font-medium text-[var(--hq-cream)]">
                    {statusLabels[status]}
                  </h4>
                  <span className="ml-auto text-xs text-[var(--hq-muted)]">
                    {statusActions.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {statusActions.length === 0 ? (
                    <p className="text-xs text-[var(--hq-muted)]">
                      No actions
                    </p>
                  ) : (
                    statusActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-start gap-2 rounded-md border border-[var(--hq-line)] bg-[var(--hq)] p-2"
                      >
                        <button
                          onClick={() =>
                            handleToggleStatus(action.id, action.status)
                          }
                          className={`mt-0.5 shrink-0 ${getStatusColor(
                            action.status,
                          )} hover:opacity-80`}
                        >
                          {action.status === "DONE" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Circle className="h-4 w-4" />
                          )}
                        </button>

                        <div className="flex-1">
                          <p
                            className={`text-xs ${
                              action.status === "DONE"
                                ? "line-through text-[var(--hq-muted)]"
                                : "text-[var(--hq-cream)]"
                            }`}
                          >
                            {action.task}
                          </p>

                          {action.owner && (
                            <p className="mt-0.5 text-[10px] text-[var(--hq-muted)]">
                              Owner: {action.owner}
                            </p>
                          )}

                          {action.due_date && (
                            <p className="mt-0.5 text-[10px] text-[var(--hq-muted)]">
                              Due:{" "}
                              {new Date(action.due_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteAction(action.id)}
                          className="shrink-0 rounded-md p-1 text-[var(--hq-muted)] hover:bg-[var(--hq-line)]"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Action Form */}
        <div className="mt-6 rounded-md border border-[var(--hq-line)] bg-[var(--hq-panel)] p-4">
          {!isAddingAction ? (
            <button
              onClick={() => setIsAddingAction(true)}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-[var(--hq-line)] py-2 text-sm text-[var(--hq-muted)] hover:text-[var(--hq-cream)]"
            >
              <Plus className="h-4 w-4" />
              Add Action
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Task *
                </label>
                <input
                  type="text"
                  value={newActionData.task}
                  onChange={(e) =>
                    setNewActionData((prev) => ({
                      ...prev,
                      task: e.target.value,
                    }))
                  }
                  placeholder="What needs to be done?"
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Owner
                </label>
                <input
                  type="text"
                  value={newActionData.owner}
                  onChange={(e) =>
                    setNewActionData((prev) => ({
                      ...prev,
                      owner: e.target.value,
                    }))
                  }
                  placeholder="Who is responsible?"
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--hq-cream)]">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newActionData.due_date}
                  onChange={(e) =>
                    setNewActionData((prev) => ({
                      ...prev,
                      due_date: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded border border-[var(--hq-line)] bg-[var(--hq)] px-3 py-2 text-[var(--hq-cream)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddingAction(false)}
                  className="flex-1 rounded border border-[var(--hq-line)] px-3 py-2 text-sm font-medium text-[var(--hq-cream)] hover:bg-[var(--hq-line)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddAction}
                  disabled={isLoading}
                  className="flex-1 rounded bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "Adding..." : "Add Action"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
