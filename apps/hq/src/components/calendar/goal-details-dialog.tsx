"use client";

import { useState } from "react";
import { X, Check, RotateCcw } from "lucide-react";
import type { Goal } from "@/src/types/goals";

interface GoalDetailsDialogProps {
  goal: Goal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoalDetailsDialog({ goal, open, onOpenChange }: GoalDetailsDialogProps) {
  const [isToggling, setIsToggling] = useState(false);

  if (!goal) return null;

  const handleToggleComplete = async () => {
    try {
      setIsToggling(true);
      const response = await fetch("/api/goals/toggle-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: goal.id,
          completed: !goal.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update goal");
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update goal");
    } finally {
      setIsToggling(false);
    }
  };

  const startTime = goal.scheduled_start ? new Date(goal.scheduled_start) : null;
  const endTime = goal.scheduled_end ? new Date(goal.scheduled_end) : null;
  const duration =
    startTime && endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000))
      : null;
  const hours = duration ? Math.floor(duration / 60) : 0;
  const minutes = duration ? duration % 60 : 0;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-[#1a2326] p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className={`text-xl font-semibold ${goal.completed ? "text-green-400 line-through" : "text-[var(--hq-cream)]"}`}>
                  🎯 {goal.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--hq-muted)]">
                  {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)}
                </p>
              </div>
              <button onClick={() => onOpenChange(false)} className="rounded-md p-1 hover:bg-white/10">
                <X size={20} />
              </button>
            </div>

            {goal.description && (
              <div className="mb-4">
                <p className="text-sm text-[var(--hq-muted)] leading-6">{goal.description}</p>
              </div>
            )}

            <div className="mb-6 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#8cbde0]">DUE DATE</p>
                <p className="mt-1 text-sm text-white">
                  {new Date(goal.due_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {startTime && endTime && (
                <div>
                  <p className="text-xs font-semibold text-[#8cbde0]">SCHEDULED TIME</p>
                  <p className="mt-1 text-sm text-white">
                    {startTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {endTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-1 text-sm text-[var(--hq-muted)]">
                    {hours > 0 && `${hours}h `}
                    {minutes}m
                  </p>
                </div>
              )}

              {goal.goal_type !== "task" && goal.target_value && (
                <div>
                  <p className="text-xs font-semibold text-[#8cbde0]">TARGET</p>
                  <p className="mt-1 text-sm text-white">
                    {goal.target_value} {goal.unit}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#8cbde0]">STATUS</p>
                <p className={`mt-1 text-sm ${goal.completed ? "text-green-400" : "text-amber-400"}`}>
                  {goal.completed ? "✓ Completed" : "→ Active"}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleComplete}
              disabled={isToggling}
              className={`w-full rounded-md px-4 py-2 text-sm font-medium transition flex items-center justify-center gap-2 ${
                goal.completed
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } disabled:opacity-50`}
            >
              {goal.completed ? (
                <>
                  <RotateCcw size={16} />
                  Mark Incomplete
                </>
              ) : (
                <>
                  <Check size={16} />
                  Mark Complete
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
