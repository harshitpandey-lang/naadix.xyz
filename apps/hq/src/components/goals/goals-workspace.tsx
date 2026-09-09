"use client";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import { useMemo, useState } from "react";

import type { Goal } from "@/src/types/goals";

type GoalFilter =
  | "all"
  | "active"
  | "completed";

interface GoalsWorkspaceProps {
  initialGoals: Goal[];
}

function formatDate(value: string) {
  return new Date(
    `${value}T00:00:00`,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function goalTypeLabel(
  type: Goal["goal_type"],
) {
  switch (type) {
    case "duration":
      return "Duration";
    case "quantity":
      return "Quantity";
    default:
      return "Task";
  }
}

export function GoalsWorkspace({
  initialGoals,
}: GoalsWorkspaceProps) {
  const [goals, setGoals] =
    useState(initialGoals);

  const [filter, setFilter] =
    useState<GoalFilter>("all");

  const [busyId, setBusyId] =
    useState<string | null>(null);

  const filteredGoals = useMemo(() => {
    if (filter === "active") {
      return goals.filter(
        (goal) => !goal.completed,
      );
    }

    if (filter === "completed") {
      return goals.filter(
        (goal) => goal.completed,
      );
    }

    return goals;
  }, [filter, goals]);

  const activeCount = goals.filter(
    (goal) => !goal.completed,
  ).length;

  const completedCount = goals.filter(
    (goal) => goal.completed,
  ).length;

  async function toggleGoal(
    goal: Goal,
  ) {
    try {
      setBusyId(goal.id);

      const response = await fetch(
        "/api/goals/toggle-complete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: goal.id,
            completed: !goal.completed,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to update goal.",
        );
      }

      setGoals((current) =>
        current.map((item) =>
          item.id === goal.id
            ? {
                ...item,
                completed:
                  !item.completed,
                completed_at:
                  !item.completed
                    ? new Date().toISOString()
                    : null,
              }
            : item,
        ),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Unable to update goal.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteGoal(
    goal: Goal,
  ) {
    if (
      !window.confirm(
        `Delete "${goal.title}"?`,
      )
    ) {
      return;
    }

    try {
      setBusyId(goal.id);

      const response = await fetch(
        `/api/goals/${goal.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          "Unable to delete goal.",
        );
      }

      setGoals((current) =>
        current.filter(
          (item) => item.id !== goal.id,
        ),
      );
    } catch {
      alert(
        "The goal could not be deleted.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="hq-content">
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--hq-accent)]">
              <Target size={13} />
              Workspace
            </div>

            <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[var(--hq-cream)] sm:text-4xl">
              Goals
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--hq-muted)]">
              A simple database for the things
              you want to move forward.
            </p>
          </div>

          <button
            type="button"
            disabled
            title="Goal creation UI will be connected next"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--hq-accent)] px-4 py-2 text-sm font-medium text-[var(--navy)] opacity-80"
          >
            <Plus size={15} />
            New goal
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="hq-panel rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--hq-muted)]">
            Total
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--hq-cream)]">
            {goals.length}
          </p>
        </div>

        <div className="hq-panel rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--hq-muted)]">
            Active
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--hq-cream)]">
            {activeCount}
          </p>
        </div>

        <div className="hq-panel rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--hq-muted)]">
            Completed
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--hq-cream)]">
            {completedCount}
          </p>
        </div>
      </section>

      {/* Database */}
      <section className="hq-panel overflow-hidden rounded-lg">
        {/* Database toolbar */}
        <div className="flex flex-col gap-3 border-b border-[var(--hq-line)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-md bg-white/[0.025] p-1">
            {(
              [
                ["all", "All"],
                ["active", "Active"],
                ["completed", "Completed"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilter(value)
                }
                className={`rounded px-3 py-1.5 text-xs transition ${
                  filter === value
                    ? "bg-white/[0.08] text-white"
                    : "text-[var(--hq-muted)] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-[var(--hq-muted)]">
            {filteredGoals.length}{" "}
            {filteredGoals.length === 1
              ? "goal"
              : "goals"}
          </span>
        </div>

        {/* Column header */}
        <div className="hidden min-w-[760px] grid-cols-[minmax(280px,1fr)_130px_150px_150px_48px] border-b border-[var(--hq-line-soft)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--hq-muted)] md:grid">
          <span>Goal</span>
          <span>Type</span>
          <span>Due date</span>
          <span>Status</span>
          <span />
        </div>

        {/* Rows */}
        {filteredGoals.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {filteredGoals.map(
                (goal, index) => (
                  <div
                    key={goal.id}
                    className={`grid grid-cols-[minmax(280px,1fr)_130px_150px_150px_48px] items-center px-4 py-3 transition hover:bg-white/[0.025] ${
                      index > 0
                        ? "border-t border-[var(--hq-line-soft)]"
                        : ""
                    }`}
                  >
                    {/* Goal */}
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        disabled={
                          busyId === goal.id
                        }
                        onClick={() =>
                          toggleGoal(goal)
                        }
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition ${
                          goal.completed
                            ? "border-[var(--hq-green)] bg-[var(--hq-green)]/10 text-[var(--hq-green)]"
                            : "border-[var(--hq-line)] text-transparent hover:border-[var(--hq-accent)]"
                        }`}
                        aria-label={
                          goal.completed
                            ? "Mark incomplete"
                            : "Mark complete"
                        }
                      >
                        {goal.completed ? (
                          <Check size={14} />
                        ) : (
                          <Circle size={14} />
                        )}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${
                            goal.completed
                              ? "text-[var(--hq-muted)] line-through"
                              : "text-[var(--hq-cream)]"
                          }`}
                        >
                          {goal.title}
                        </p>

                        {goal.description && (
                          <p className="mt-0.5 truncate text-[11px] text-[var(--hq-muted)]">
                            {goal.description}
                          </p>
                        )}

                        {goal.target_value !==
                          null && (
                          <p className="mt-1 text-[10px] text-[var(--hq-muted)]">
                            Target:{" "}
                            {
                              goal.target_value
                            }{" "}
                            {goal.unit ?? ""}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Type */}
                    <div className="text-xs text-[var(--hq-muted-strong)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Target size={12} />
                        {goalTypeLabel(
                          goal.goal_type,
                        )}
                      </span>
                    </div>

                    {/* Due */}
                    <div className="text-xs text-[var(--hq-muted-strong)]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays
                          size={12}
                        />
                        {formatDate(
                          goal.due_date,
                        )}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          goal.completed
                            ? "bg-[var(--hq-green)]/10 text-[var(--hq-green)]"
                            : "bg-[var(--hq-accent-soft)] text-[var(--hq-accent)]"
                        }`}
                      >
                        {goal.completed ? (
                          <CheckCircle2
                            size={11}
                          />
                        ) : (
                          <Clock3
                            size={11}
                          />
                        )}

                        {goal.completed
                          ? "Completed"
                          : "Active"}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      disabled={
                        busyId === goal.id
                      }
                      onClick={() =>
                        deleteGoal(goal)
                      }
                      className="grid h-7 w-7 place-items-center rounded-md text-[var(--hq-muted)] transition hover:bg-red-400/10 hover:text-[var(--hq-red)]"
                      aria-label={`Delete ${goal.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-white/[0.04] text-[var(--hq-muted)]">
              <Target size={18} />
            </div>

            <h2 className="mt-4 text-sm font-medium text-[var(--hq-cream)]">
              No goals in this view
            </h2>

            <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--hq-muted)]">
              {filter === "completed"
                ? "Completed goals will appear here."
                : "Create a goal to start building your workspace."}
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <div className="mt-5 flex items-center gap-2 text-[10px] text-[var(--hq-muted)]">
        <MoreHorizontal size={13} />
        Goals remain connected to your calendar.
      </div>
    </main>
  );
}
