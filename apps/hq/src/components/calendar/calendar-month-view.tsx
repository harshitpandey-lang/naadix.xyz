"use client";

import { useMemo, useState } from "react";
import { Check, Clock3 } from "lucide-react";

import type { CalendarEvent } from "@/src/types/calendar";
import type { Goal } from "@/src/types/goals";

import { EventDetailsDialog } from "./event-details-dialog";
import { GoalDetailsDialog } from "./goal-details-dialog";

interface CalendarMonthViewProps {
  date: Date;
  events: CalendarEvent[];
  goals: Goal[];
}

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const MAX_VISIBLE_ITEMS = 3;

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

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

export function CalendarMonthView({
  date,
  events,
  goals,
}: CalendarMonthViewProps) {
  const [
    selectedEvent,
    setSelectedEvent,
  ] = useState<CalendarEvent | null>(null);

  const [
    selectedGoal,
    setSelectedGoal,
  ] = useState<Goal | null>(null);

  const today = new Date();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      1,
    );

    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    );

    const leadingDays =
      firstDay.getDay();

    const totalDays =
      lastDay.getDate();

    const rawDays: Array<
      Date | null
    > = [];

    for (
      let index = 0;
      index < leadingDays;
      index += 1
    ) {
      rawDays.push(null);
    }

    for (
      let day = 1;
      day <= totalDays;
      day += 1
    ) {
      rawDays.push(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          day,
        ),
      );
    }

    while (rawDays.length % 7 !== 0) {
      rawDays.push(null);
    }

    return rawDays;
  }, [date]);

  const getItemsForDay = (
    day: Date | null,
  ) => {
    if (!day) {
      return {
        events: [],
        goals: [],
      };
    }

    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(
      23,
      59,
      59,
      999,
    );

    const dayEvents = events.filter(
      (event) => {
        const start = new Date(
          event.start_at,
        );

        const end = new Date(
          event.end_at,
        );

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

        const start = new Date(
          goal.scheduled_start,
        );

        const end = new Date(
          goal.scheduled_end,
        );

        return (
          start <= dayEnd &&
          end >= dayStart
        );
      },
    );

    return {
      events: dayEvents,
      goals: dayGoals,
    };
  };

  return (
    <div className="overflow-hidden">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-[var(--hq-line)] bg-[var(--hq-panel)]">
        {WEEKDAYS.map(
          (weekday) => (
            <div
              key={weekday}
              className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--hq-muted)] sm:px-3"
            >
              {weekday}
            </div>
          ),
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--hq-line-soft)]">
        {calendarDays.map(
          (day, index) => {
            const {
              events: dayEvents,
              goals: dayGoals,
            } =
              getItemsForDay(day);

            const isToday =
              day !== null &&
              sameDay(day, today);

            const isEmpty =
              day === null;

            const combined = [
              ...dayEvents.map(
                (event) => ({
                  type: "event" as const,
                  id: event.id,
                  item: event,
                }),
              ),
              ...dayGoals.map(
                (goal) => ({
                  type: "goal" as const,
                  id: goal.id,
                  item: goal,
                }),
              ),
            ];

            const visibleItems =
              combined.slice(
                0,
                MAX_VISIBLE_ITEMS,
              );

            const hiddenCount =
              Math.max(
                0,
                combined.length -
                  MAX_VISIBLE_ITEMS,
              );

            return (
              <div
                key={`${day?.toISOString() ?? "empty"}-${index}`}
                className={`min-h-[108px] bg-[var(--hq-panel)] p-2 transition sm:min-h-[128px] sm:p-2.5 ${
                  isEmpty
                    ? "bg-[var(--hq-sidebar)] opacity-50"
                    : "hover:bg-[var(--hq-panel-hover)]"
                }`}
              >
                {/* Day number */}
                <div className="mb-2 flex items-center justify-between">
                  {day ? (
                    <span
                      className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-[11px] font-medium ${
                        isToday
                          ? "bg-[var(--hq-accent)] font-semibold text-[var(--navy)]"
                          : "text-[var(--hq-muted-strong)]"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                  ) : (
                    <span />
                  )}

                  {day &&
                    combined.length >
                      0 && (
                      <span className="text-[9px] text-[var(--hq-muted)]">
                        {combined.length}
                      </span>
                    )}
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {visibleItems.map(
                    (entry) => {
                      if (
                        entry.type ===
                        "event"
                      ) {
                        const event =
                          entry.item;

                        return (
                          <button
                            key={`event-${event.id}`}
                            type="button"
                            onClick={() =>
                              setSelectedEvent(
                                event,
                              )
                            }
                            className="group flex w-full min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-left transition hover:bg-[var(--hq-accent-soft)]"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hq-accent)]" />

                            <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--hq-muted-strong)] group-hover:text-[var(--hq-cream)] sm:text-[11px]">
                              {event.title}
                            </span>

                            <span className="hidden shrink-0 text-[9px] text-[var(--hq-muted)] xl:inline">
                              {formatTime(
                                event.start_at,
                              )}
                            </span>
                          </button>
                        );
                      }

                      const goal =
                        entry.item;

                      return (
                        <button
                          key={`goal-${goal.id}`}
                          type="button"
                          onClick={() =>
                            setSelectedGoal(
                              goal,
                            )
                          }
                          className={`group flex w-full min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-left transition ${
                            goal.completed
                              ? "opacity-55 hover:bg-white/[0.025]"
                              : "hover:bg-[var(--hq-accent-soft)]"
                          }`}
                        >
                          {goal.completed ? (
                            <Check
                              size={11}
                              className="shrink-0 text-[var(--hq-green)]"
                            />
                          ) : (
                            <Clock3
                              size={11}
                              className="shrink-0 text-[var(--hq-yellow)]"
                            />
                          )}

                          <span
                            className={`min-w-0 flex-1 truncate text-[10px] sm:text-[11px] ${
                              goal.completed
                                ? "text-[var(--hq-muted)] line-through"
                                : "text-[var(--hq-muted-strong)] group-hover:text-[var(--hq-cream)]"
                            }`}
                          >
                            {goal.title}
                          </span>
                        </button>
                      );
                    },
                  )}

                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      className="px-1.5 text-[9px] font-medium text-[var(--hq-muted)] transition hover:text-[var(--hq-accent)]"
                    >
                      +{hiddenCount} more
                    </button>
                  )}
                </div>
              </div>
            );
          },
        )}
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
