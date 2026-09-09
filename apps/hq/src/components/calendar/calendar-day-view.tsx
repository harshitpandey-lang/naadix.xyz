"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  MapPin,
} from "lucide-react";

import type { CalendarEvent } from "@/src/types/calendar";
import type { Goal } from "@/src/types/goals";

import { EventDetailsDialog } from "./event-details-dialog";
import { GoalDetailsDialog } from "./goal-details-dialog";

interface CalendarDayViewProps {
  date: Date;
  events: CalendarEvent[];
  goals: Goal[];
}

const HOURS = Array.from(
  { length: 24 },
  (_, index) => index,
);

function formatHour(hour: number) {
  return new Date(
    2000,
    0,
    1,
    hour,
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

export function CalendarDayView({
  date,
  events,
  goals,
}: CalendarDayViewProps) {
  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<CalendarEvent | null>(null);

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState<Goal | null>(null);

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(
    23,
    59,
    59,
    999,
  );

  const dayEvents = events.filter(
    (event) => {
      const start =
        new Date(event.start_at);
      const end =
        new Date(event.end_at);

      return (
        start <= dayEnd &&
        end >= dayStart
      );
    },
  );

  const dayGoals = goals.filter(
    (goal) => {
      if (
        !goal.scheduled_start ||
        !goal.scheduled_end
      ) {
        return false;
      }

      const start =
        new Date(
          goal.scheduled_start,
        );

      const end =
        new Date(
          goal.scheduled_end,
        );

      return (
        start <= dayEnd &&
        end >= dayStart
      );
    },
  );

  const getItemsForHour = (
    hour: number,
  ) => {
    const start = new Date(date);
    start.setHours(
      hour,
      0,
      0,
      0,
    );

    const end = new Date(date);
    end.setHours(
      hour + 1,
      0,
      0,
      0,
    );

    return {
      events: dayEvents.filter(
        (event) => {
          const eventStart =
            new Date(
              event.start_at,
            );

          const eventEnd =
            new Date(
              event.end_at,
            );

          return (
            eventStart < end &&
            eventEnd > start
          );
        },
      ),
      goals: dayGoals.filter(
        (goal) => {
          const goalStart =
            new Date(
              goal.scheduled_start!,
            );

          const goalEnd =
            new Date(
              goal.scheduled_end!,
            );

          return (
            goalStart < end &&
            goalEnd > start
          );
        },
      ),
    };
  };

  const dateLabel =
    date.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      },
    );

  const hasItems =
    dayEvents.length > 0 ||
    dayGoals.length > 0;

  return (
    <div>
      <div className="border-b border-[var(--hq-line)] px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <CalendarDays
            size={15}
            className="text-[var(--hq-accent)]"
          />

          <h2 className="text-sm font-medium text-[var(--hq-cream)]">
            {dateLabel}
          </h2>
        </div>

        <p className="mt-1 text-xs text-[var(--hq-muted)]">
          {hasItems
            ? `${dayEvents.length + dayGoals.length} scheduled item${dayEvents.length + dayGoals.length === 1 ? "" : "s"}`
            : "Nothing scheduled"}
        </p>
      </div>

      {!hasItems ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-white/[0.04] text-[var(--hq-muted)]">
            <CalendarDays size={18} />
          </div>

          <p className="mt-4 text-sm text-[var(--hq-muted)]">
            Nothing scheduled for this day.
          </p>
        </div>
      ) : (
        <div>
          {HOURS.map(
            (hour) => {
              const {
                events:
                  hourEvents,
                goals:
                  hourGoals,
              } =
                getItemsForHour(
                  hour,
                );

              const hasContent =
                hourEvents.length >
                  0 ||
                hourGoals.length >
                  0;

              return (
                <div
                  key={hour}
                  className="grid grid-cols-[64px_minmax(0,1fr)] border-t border-[var(--hq-line-soft)] first:border-t-0"
                >
                  <div className="bg-[var(--hq-sidebar)] px-2 py-3 text-right text-[10px] text-[var(--hq-muted)]">
                    {formatHour(hour)}
                  </div>

                  <div
                    className={`min-h-[64px] p-2 sm:p-3 ${
                      hasContent
                        ? "bg-white/[0.008]"
                        : ""
                    }`}
                  >
                    <div className="space-y-2">
                      {hourEvents.map(
                        (event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() =>
                              setSelectedEvent(
                                event,
                              )
                            }
                            className="w-full rounded-md border border-[var(--hq-accent)]/20 bg-[var(--hq-accent-soft)] p-3 text-left transition hover:border-[var(--hq-accent)]/40 hover:bg-[var(--hq-accent)]/15"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-sm font-medium text-[var(--hq-accent)]">
                                {event.title}
                              </span>

                              <span className="shrink-0 text-[10px] text-[var(--hq-muted)]">
                                {formatTime(
                                  event.start_at,
                                )}
                              </span>
                            </div>

                            {event.location && (
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--hq-muted)]">
                                <MapPin size={11} />
                                {event.location}
                              </div>
                            )}
                          </button>
                        ),
                      )}

                      {hourGoals.map(
                        (goal) => {
                          const start =
                            new Date(
                              goal.scheduled_start!,
                            );

                          const end =
                            new Date(
                              goal.scheduled_end!,
                            );

                          const duration =
                            Math.max(
                              0,
                              Math.round(
                                (end.getTime() -
                                  start.getTime()) /
                                  60000,
                              ),
                            );

                          const hours =
                            Math.floor(
                              duration /
                                60,
                            );

                          const minutes =
                            duration %
                            60;

                          const durationLabel =
                            hours > 0
                              ? `${hours}h ${minutes}m`
                              : `${minutes}m`;

                          return (
                            <button
                              key={`goal-${goal.id}`}
                              type="button"
                              onClick={() =>
                                setSelectedGoal(
                                  goal,
                                )
                              }
                              className={`w-full rounded-md border p-3 text-left transition ${
                                goal.completed
                                  ? "border-[var(--hq-green)]/15 bg-[var(--hq-green)]/5 opacity-60"
                                  : "border-[var(--hq-yellow)]/20 bg-[var(--hq-yellow)]/5 hover:border-[var(--hq-yellow)]/35"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {goal.completed ? (
                                  <Check
                                    size={14}
                                    className="mt-0.5 shrink-0 text-[var(--hq-green)]"
                                  />
                                ) : (
                                  <Clock3
                                    size={14}
                                    className="mt-0.5 shrink-0 text-[var(--hq-yellow)]"
                                  />
                                )}

                                <div className="min-w-0">
                                  <p
                                    className={`text-sm font-medium ${
                                      goal.completed
                                        ? "text-[var(--hq-muted)] line-through"
                                        : "text-[var(--hq-muted-strong)]"
                                    }`}
                                  >
                                    {goal.title}
                                  </p>

                                  <p className="mt-1 text-[10px] text-[var(--hq-muted)]">
                                    {formatTime(
                                      goal.scheduled_start!,
                                    )}{" "}
                                    ·{" "}
                                    {durationLabel}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      <EventDetailsDialog
        event={selectedEvent}
        open={Boolean(selectedEvent)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvent(null);
          }
        }}
      />

      <GoalDetailsDialog
        goal={selectedGoal}
        open={Boolean(selectedGoal)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedGoal(null);
          }
        }}
      />
    </div>
  );
}
