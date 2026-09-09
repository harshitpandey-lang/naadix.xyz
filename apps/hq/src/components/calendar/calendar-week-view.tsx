"use client";

import { useState } from "react";
import {
  Check,
  Clock3,
} from "lucide-react";

import type { CalendarEvent } from "@/src/types/calendar";
import type { Goal } from "@/src/types/goals";

import { EventDetailsDialog } from "./event-details-dialog";
import { GoalDetailsDialog } from "./goal-details-dialog";

interface CalendarWeekViewProps {
  date: Date;
  events: CalendarEvent[];
  goals: Goal[];
}

const HOURS = Array.from(
  { length: 24 },
  (_, index) => index,
);

const DAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function sameDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

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

export function CalendarWeekView({
  date,
  events,
  goals,
}: CalendarWeekViewProps) {
  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<CalendarEvent | null>(null);

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState<Goal | null>(null);

  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(
    weekStart.getDate() -
      weekStart.getDay(),
  );

  const weekDays = Array.from(
    { length: 7 },
    (_, index) => {
      const day = new Date(weekStart);
      day.setDate(
        day.getDate() + index,
      );
      return day;
    },
  );

  const getItemsForSlot = (
    day: Date,
    hour: number,
  ) => {
    const start = new Date(day);
    start.setHours(hour, 0, 0, 0);

    const end = new Date(day);
    end.setHours(
      hour + 1,
      0,
      0,
      0,
    );

    const slotEvents = events.filter(
      (event) => {
        const eventStart =
          new Date(event.start_at);
        const eventEnd =
          new Date(event.end_at);

        return (
          eventStart < end &&
          eventEnd > start
        );
      },
    );

    const slotGoals = goals.filter(
      (goal) => {
        if (
          !goal.scheduled_start ||
          !goal.scheduled_end
        ) {
          return false;
        }

        const goalStart =
          new Date(
            goal.scheduled_start,
          );

        const goalEnd =
          new Date(
            goal.scheduled_end,
          );

        return (
          goalStart < end &&
          goalEnd > start
        );
      },
    );

    return {
      slotEvents,
      slotGoals,
    };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header */}
        <div className="grid grid-cols-[64px_repeat(7,minmax(110px,1fr))] border-b border-[var(--hq-line)]">
          <div />

          {weekDays.map(
            (day) => {
              const today =
                sameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className="border-l border-[var(--hq-line-soft)] px-3 py-3"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hq-muted)]">
                    {DAYS[day.getDay()]}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs font-semibold ${
                        today
                          ? "bg-[var(--hq-accent)] text-[var(--navy)]"
                          : "text-[var(--hq-cream)]"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    <span className="text-[10px] text-[var(--hq-muted)]">
                      {day.toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                        },
                      )}
                    </span>
                  </div>
                </div>
              );
            },
          )}
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-[64px_repeat(7,minmax(110px,1fr))]">
          {HOURS.map(
            (hour) => (
              <div
                key={hour}
                className="contents"
              >
                <div className="border-t border-[var(--hq-line-soft)] px-2 py-2 text-right text-[10px] text-[var(--hq-muted)]">
                  {formatHour(hour)}
                </div>

                {weekDays.map(
                  (day) => {
                    const {
                      slotEvents,
                      slotGoals,
                    } =
                      getItemsForSlot(
                        day,
                        hour,
                      );

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="min-h-[64px] border-l border-t border-[var(--hq-line-soft)] p-1.5 transition hover:bg-white/[0.018]"
                      >
                        <div className="space-y-1">
                          {slotEvents.map(
                            (event) => (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() =>
                                  setSelectedEvent(
                                    event,
                                  )
                                }
                                className="group flex w-full items-start gap-1.5 rounded-md bg-[var(--hq-accent-soft)] px-2 py-1.5 text-left transition hover:bg-[var(--hq-accent)]/20"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hq-accent)]" />

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[10px] font-medium text-[var(--hq-accent)]">
                                    {event.title}
                                  </span>

                                  <span className="mt-0.5 block truncate text-[9px] text-[var(--hq-muted)]">
                                    {formatTime(
                                      event.start_at,
                                    )}
                                  </span>
                                </span>
                              </button>
                            ),
                          )}

                          {slotGoals.map(
                            (goal) => (
                              <button
                                key={`goal-${goal.id}`}
                                type="button"
                                onClick={() =>
                                  setSelectedGoal(
                                    goal,
                                  )
                                }
                                className={`group flex w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-left transition ${
                                  goal.completed
                                    ? "bg-[var(--hq-green)]/8 opacity-60"
                                    : "bg-[var(--hq-yellow)]/8 hover:bg-[var(--hq-yellow)]/15"
                                }`}
                              >
                                {goal.completed ? (
                                  <Check
                                    size={11}
                                    className="mt-0.5 shrink-0 text-[var(--hq-green)]"
                                  />
                                ) : (
                                  <Clock3
                                    size={11}
                                    className="mt-0.5 shrink-0 text-[var(--hq-yellow)]"
                                  />
                                )}

                                <span
                                  className={`min-w-0 truncate text-[10px] ${
                                    goal.completed
                                      ? "text-[var(--hq-muted)] line-through"
                                      : "text-[var(--hq-muted-strong)]"
                                  }`}
                                >
                                  {goal.title}
                                </span>
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            ),
          )}
        </div>
      </div>

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
